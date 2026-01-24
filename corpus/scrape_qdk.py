#!/usr/bin/env python3
"""
Scrape Q# examples from the Microsoft Quantum Development Kit (QDK) repository.
Extracts all .qs files from samples/ and katas/, deduplicates, and curates to 40-70 high-quality examples.
"""

import json
import os
import re
import shutil
import hashlib
from pathlib import Path
from typing import List, Dict, Set
from difflib import SequenceMatcher
from collections import Counter

# Configuration
REPO_URL = "https://github.com/microsoft/qdk.git"
CACHE_DIR = Path("corpus/qdk-cache")
OUTPUT_FILE = Path("corpus/index.json")
TARGET_EXAMPLE_COUNT = (40, 70)  # min, max

# Folders to search within the QDK repo
SEARCH_FOLDERS = ["samples", "katas"]

# Keywords for tag inference
TAG_KEYWORDS = {
    "entanglement": ["entangle", "bell", "ghz", "maximally", "correlation"],
    "gate": ["gate", "hadamard", "cnot", "x", "y", "z", "phase", "s", "t", "rotation"],
    "measurement": ["measure", "m(", "measurement", "observe"],
    "oracle": ["oracle", "mark", "oraclereflection"],
    "search": ["search", "grover", "amplitude", "amplification"],
    "fourier": ["qft", "fourier", "transform"],
    "teleportation": ["teleport", "transfer"],
    "superposition": ["superposition", "equal", "h("],
    "deutsch": ["deutsch", "jozsa"],
    "bernstein": ["bernstein", "vazirani"],
    "simon": ["simon"],
    "phase_estimation": ["phase", "estimation", "pe"],
    "amplitude_estimation": ["amplitude", "estimation"],
    "arithmetic": ["add", "multiply", "increment", "comparator"],
    "error": ["error", "correction", "ecc", "stabilizer"],
    "cryptography": ["crypt", "bennett", "bb84"],
    "chemistry": ["chemistry", "jordan", "wiggle", "trotter"],
    "machine": ["machine", "learning", "qml"],
    "basics": ["basics", "intro", "fundamental", "tutorial"],
    "kata": ["kata", "exercise"],
    "algorithm": ["algorithm", "quantum", "problem"],
}


def clone_or_update_repo() -> Path:
    """Clone the QDK repo or update if it already exists."""
    if CACHE_DIR.exists():
        print(f"✓ Using cached QDK repo at {CACHE_DIR}")
        # Try to update, but don't fail if we can't
        try:
            import subprocess
            subprocess.run(
                ["git", "pull"],
                cwd=CACHE_DIR,
                capture_output=True,
                check=True,
                timeout=30
            )
            print("  → Repo updated")
        except Exception as e:
            print(f"  → Could not update repo (continuing with cached version): {e}")
        return CACHE_DIR

    print(f"Cloning QDK repo to {CACHE_DIR}...")
    try:
        import subprocess
        subprocess.run(
            ["git", "clone", "--depth", "1", REPO_URL, str(CACHE_DIR)],
            check=True,
            timeout=300  # 5 minutes max
        )
        print("✓ Repo cloned successfully")
        return CACHE_DIR
    except Exception as e:
        print(f"✗ Failed to clone repo: {e}")
        raise


def find_qs_files(repo_root: Path) -> List[Path]:
    """Find all .qs files in the specified search folders."""
    qs_files = []

    for folder in SEARCH_FOLDERS:
        folder_path = repo_root / folder
        if not folder_path.exists():
            print(f"  ! Folder not found: {folder}")
            continue

        for qs_file in folder_path.rglob("*.qs"):
            qs_files.append(qs_file)

    return qs_files


def extract_id_from_path(file_path: Path) -> str:
    """Generate a clean ID from filename and parent folder."""
    # Get filename without extension
    filename = file_path.stem

    # Convert CamelCase to kebab-case
    # "BellState" → "bell-state"
    id_parts = re.findall(r'[A-Z]?[a-z]+', filename)
    if not id_parts:
        id_parts = [filename]

    id_str = '-'.join([p.lower() for p in id_parts if p])

    # If too short, include parent folder
    if len(id_str) < 5:
        parent = file_path.parent.name
        parent_parts = re.findall(r'[A-Z]?[a-z]+', parent)
        parent_str = '-'.join([p.lower() for p in parent_parts if p])
        id_str = f"{parent_str}-{id_str}" if parent_str else id_str

    # Sanitize
    id_str = re.sub(r'[^a-z0-9-]', '-', id_str)
    id_str = re.sub(r'-+', '-', id_str).strip('-')

    return id_str or "unknown"


def extract_description(code: str, file_path: Path) -> str:
    """
    Extract description from:
    1. Documentation comments (///)
    2. Regular comments (//) at the top
    3. Inferred from filename
    4. Inferred from folder path
    """

    # Priority 1: Look for /// documentation comments
    doc_comments = []
    for line in code.split('\n')[:20]:  # Check first 20 lines
        line = line.strip()
        if line.startswith('///'):
            doc_comments.append(line[3:].strip())
        elif line.startswith('//'):
            # Also collect regular comments
            doc_comments.append(line[2:].strip())
        elif line and not line.startswith('//'):
            # Stop at first non-comment line
            break

    if doc_comments:
        desc = ' '.join(doc_comments)
        # Clean up: remove common prefixes, limit length
        desc = re.sub(r'^(Summary|Description|Remarks|):?\s*', '', desc, flags=re.IGNORECASE)
        desc = desc[:500].strip()
        if len(desc) > 20:
            return desc

    # Priority 2: Infer from filename
    filename = file_path.stem
    inferred = re.sub(r'([A-Z])', r' \1', filename).lower().strip()

    # Priority 3: Infer from folder path
    folder = file_path.parent.name
    folder_inferred = re.sub(r'([A-Z])', r' \1', folder).lower().strip()

    if folder_inferred and folder_inferred != inferred:
        inferred = f"{folder_inferred} {inferred}"

    return inferred.capitalize()[:200]


def extract_tags(code: str, file_path: Path, description: str) -> List[str]:
    """Extract tags from folder names, code keywords, and description."""
    tags = set()

    # Tags from folder path
    for part in file_path.parts:
        part_lower = part.lower()
        for keyword in TAG_KEYWORDS:
            if keyword in part_lower:
                tags.add(keyword)

    # Tags from code keywords
    code_lower = code.lower()
    for tag, keywords in TAG_KEYWORDS.items():
        for kw in keywords:
            if kw in code_lower:
                tags.add(tag)
                break

    # Tags from description
    desc_lower = description.lower()
    for tag, keywords in TAG_KEYWORDS.items():
        if tag in desc_lower:
            tags.add(tag)

    # Remove "kata" and "basics" as primary tags (keep only if no other tags)
    if len(tags) > 2 and "kata" in tags:
        tags.remove("kata")
    if len(tags) > 2 and "basics" in tags:
        tags.remove("basics")

    # Sort and limit
    return sorted(list(tags))[:8]


def extract_operations(code: str) -> Set[str]:
    """Extract operation and function names from Q# code."""
    # Match: operation Name(...) or function Name(...)
    pattern = r'\b(operation|function)\s+(\w+)'
    matches = re.findall(pattern, code)
    return {match[1] for match in matches}


def compute_code_hash(code: str) -> str:
    """Compute a hash of normalized code for deduplication."""
    # Normalize: remove comments, extra whitespace
    normalized = re.sub(r'//[^\n]*', '', code)  # Remove // comments
    normalized = re.sub(r'/\*.*?\*/', '', normalized, flags=re.DOTALL)  # Remove /* */ comments
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return hashlib.md5(normalized.encode()).hexdigest()


def similarity_score(a: str, b: str) -> float:
    """Compute similarity between two strings (0-1)."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def deduplicate_examples(examples: List[Dict]) -> List[Dict]:
    """
    Remove duplicates using similarity-based approach.
    1. Exact code hash matches
    2. Similar operation names
    3. Similar descriptions
    """
    print(f"\nDeduplicating {len(examples)} examples...")

    # Remove exact code duplicates
    seen_hashes = {}
    unique_examples = []
    for ex in examples:
        code_hash = ex['code_hash']
        if code_hash in seen_hashes:
            # Keep the one with longer description
            existing = seen_hashes[code_hash]
            if len(ex['description']) > len(existing['description']):
                seen_hashes[code_hash] = ex
        else:
            seen_hashes[code_hash] = ex

    unique_examples = list(seen_hashes.values())
    print(f"  → After code hash dedup: {len(unique_examples)}")

    # Remove similar examples (similar operation names OR similar descriptions)
    final_examples = []
    seen_operation_signatures = set()

    for ex in sorted(unique_examples, key=lambda x: len(x['operations']), reverse=True):
        operations = set(ex['operations'])  # Convert to set for intersection

        # Check if any operation is very similar to something we've seen
        is_duplicate = False
        for existing_ops in seen_operation_signatures:
            # If they share operations, check similarity
            if operations & existing_ops:
                op_similarity = len(operations & existing_ops) / max(len(operations), len(existing_ops))
                if op_similarity > 0.5:  # >50% overlap in operations
                    # Also check description similarity
                    matching_examples = [e for e in final_examples if set(e['operations']) == existing_ops]
                    if matching_examples:
                        desc_sim = similarity_score(ex['description'], matching_examples[0]['description'])
                        if desc_sim > 0.7:
                            is_duplicate = True
                            break

        if not is_duplicate:
            final_examples.append(ex)
            seen_operation_signatures.add(frozenset(operations))

    print(f"  → After similarity dedup: {len(final_examples)}")
    return final_examples


def compute_quality_score(ex: Dict) -> float:
    """Compute a quality score for ranking examples."""
    score = 0.0

    # Has meaningful description (longer is better)
    score += min(len(ex['description']) / 100, 5)  # Max 5 points

    # Has tags
    score += min(len(ex['tags']) * 0.5, 3)  # Max 3 points

    # Has operations
    score += min(len(ex['operations']) * 0.3, 2)  # Max 2 points

    # Code length (not too short, not too long)
    code_len = len(ex['code'])
    if 100 <= code_len <= 2000:
        score += 2
    elif code_len > 50:
        score += 1

    # Bonus for important tags
    important_tags = {'entanglement', 'oracle', 'search', 'fourier', 'teleportation',
                      'deutsch', 'phase_estimation', 'error', 'cryptography'}
    if any(tag in important_tags for tag in ex['tags']):
        score += 1

    return score


def downselect_examples(examples: List[Dict]) -> List[Dict]:
    """Select 40-70 high-quality examples with good coverage."""
    print(f"\nDown-selecting to {TARGET_EXAMPLE_COUNT[0]}-{TARGET_EXAMPLE_COUNT[1]} examples...")

    if len(examples) <= TARGET_EXAMPLE_COUNT[1]:
        print(f"  → Already within range: {len(examples)} examples")
        return examples

    # Compute quality scores
    for ex in examples:
        ex['quality_score'] = compute_quality_score(ex)

    # Sort by quality score
    examples.sort(key=lambda x: x['quality_score'], reverse=True)

    # Take top candidates (more than target, then filter by tag coverage)
    candidates = examples[:TARGET_EXAMPLE_COUNT[1] * 2]

    # Ensure tag diversity
    selected = []
    seen_tags = set()

    # First pass: select best examples with unique tags
    for ex in candidates:
        ex_tags = set(ex['tags'])
        # Check if we have enough of these tags already
        overlap = len(ex_tags & seen_tags)
        if overlap < 2 or len(selected) < TARGET_EXAMPLE_COUNT[0]:
            selected.append(ex)
            seen_tags.update(ex_tags)

        if len(selected) >= TARGET_EXAMPLE_COUNT[1]:
            break

    # If we still have too many, trim by quality
    if len(selected) > TARGET_EXAMPLE_COUNT[1]:
        selected = selected[:TARGET_EXAMPLE_COUNT[1]]
    # If too few, add more from remaining candidates
    elif len(selected) < TARGET_EXAMPLE_COUNT[0]:
        for ex in candidates:
            if ex not in selected and len(selected) < TARGET_EXAMPLE_COUNT[0]:
                selected.append(ex)

    # Clean up quality_score field
    for ex in selected:
        ex.pop('quality_score', None)

    print(f"  → Selected {len(selected)} examples")
    print(f"  → Tag coverage: {sorted(list(seen_tags))}")

    return selected


def scrape_qdk():
    """Main scraping function."""
    print("=" * 60)
    print("Q# Example Scraper")
    print("=" * 60)

    # Step 1: Clone/update repo
    repo_root = clone_or_update_repo()

    # Step 2: Find all .qs files
    print(f"\nSearching for .qs files in {SEARCH_FOLDERS}...")
    qs_files = find_qs_files(repo_root)
    print(f"✓ Found {len(qs_files)} .qs files")

    # Step 3: Extract information from each file
    print(f"\nExtracting information from .qs files...")
    examples = []
    skipped = 0

    for qs_file in qs_files:
        try:
            # Read file
            with open(qs_file, 'r', encoding='utf-8') as f:
                code = f.read()

            # Skip if too short (not meaningful)
            if len(code.strip()) < 50:
                skipped += 1
                continue

            # Extract metadata
            id_str = extract_id_from_path(qs_file)
            description = extract_description(code, qs_file)
            tags = extract_tags(code, qs_file, description)
            operations = extract_operations(code)
            code_hash = compute_code_hash(code)

            # Build example
            example = {
                "id": id_str,
                "description": description,
                "code": code.strip(),
                "tags": tags,
                "operations": sorted(list(operations)),
                "code_hash": code_hash,
                "source": str(qs_file.relative_to(repo_root))
            }

            examples.append(example)

        except Exception as e:
            print(f"  ! Error processing {qs_file}: {e}")
            skipped += 1
            continue

    print(f"✓ Extracted {len(examples)} examples (skipped {skipped})")

    # Step 4: Deduplicate
    examples = deduplicate_examples(examples)

    # Step 5: Down-select to 40-70
    examples = downselect_examples(examples)

    # Step 6: Clean up internal fields before saving
    for ex in examples:
        ex.pop('operations', None)
        ex.pop('code_hash', None)

    # Step 7: Save to JSON
    print(f"\nSaving to {OUTPUT_FILE}...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(examples, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved {len(examples)} examples")
    print("\nSample examples:")
    for ex in examples[:3]:
        print(f"  - [{ex['id']}] {ex['description'][:60]}... (tags: {', '.join(ex['tags'][:3])})")

    print("\n" + "=" * 60)
    print("Scraping complete!")
    print("=" * 60)


if __name__ == "__main__":
    scrape_qdk()
