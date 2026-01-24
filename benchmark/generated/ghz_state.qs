```qsharp
/// # Summary
/// Prepares a Greenberger–Horne–Zeilinger (GHZ) state across three qubits
/// and returns the measurement results.
///
/// # Description
/// This operation creates a GHZ state, which is a maximally entangled state
/// of the form (|000⟩ + |111⟩) / √2, across three qubits.
operation CreateGHZStateAndMeasure() : Result[] {
    // Allocate 3 qubits for the GHZ state.
    use qubits = Qubit[3];

    // Prepare the GHZ state.
    PrepareGHZState(qubits);

    // Measure and reset qubits. Return results.
    return MResetEachZ(qubits);
}

/// # Summary
/// Prepares a GHZ state (|000⟩ + |111⟩) / √2 in the given qubit register.
/// All qubits are assumed to be in |0⟩ state on input.
operation PrepareGHZState(qs : Qubit[]) : Unit {
    Std.Diagnostics.Fact(Length(qs) == 3, "Qubit register must contain exactly 3 qubits.");

    // Set the first qubit into a (|0⟩ + |1⟩) / √2 superposition.
    H(qs[0]);

    // Apply CNOT gates to entangle the first qubit with the others.
    for q in qs[1...] {
        CNOT(qs[0], q);
    }
}
```