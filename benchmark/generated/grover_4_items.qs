```qsharp
/// # Summary
/// Implements Grover's search algorithm for a 2-qubit system, which corresponds to 4 items.
operation GroverSearchForFourItems() : Result[] {
    use qubits = Qubit[2];

    // Initialize a uniform superposition over all possible inputs.
    PrepareUniform(qubits);

    // Perform one Grover iteration, as the optimal number of iterations for 4 items is 1.
    ReflectAboutMarked(qubits);
    ReflectAboutUniform(qubits);

    // Measure and return the result.
    return MResetEachZ(qubits);
}

/// # Summary
/// Prepares a uniform superposition over all basis states for the given qubits.
operation PrepareUniform(qubits : Qubit[]) : Unit is Adj + Ctl {
    for q in qubits {
        H(q);
    }
}

/// # Summary
/// Reflects about the marked state |11⟩.
/// This operation defines the marked state we are trying to find in the search.
operation ReflectAboutMarked(qubits : Qubit[]) : Unit {
    within {
        // Flip the qubits to make |11⟩ the |00⟩ state.
        X(qubits[0]);
        X(qubits[1]);
    } apply {
        // Apply a Z gate to the |00⟩ state, which is the marked state.
        Z(qubits[1]);
    }
}

/// # Summary
/// Reflects about the uniform superposition state.
operation ReflectAboutUniform(qubits : Qubit[]) : Unit {
    within {
        // Transform the uniform superposition to all-zero.
        Adjoint PrepareUniform(qubits);
        // Transform the all-zero state to all-ones
        for q in qubits {
            X(q);
        }
    } apply {
        // Reflect about the all-ones state.
        Controlled Z(Most(qubits), Tail(qubits));
    }
}
```