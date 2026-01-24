```qsharp
/// # Summary
/// Creates a Bell state between two qubits and measures both.
///
/// # Description
/// This Q# operation prepares a Bell state |Φ⁺⟩ = (|00⟩+|11⟩)/√2
/// between two qubits and measures them.
operation CreateAndMeasureBellState() : (Result, Result) {
    // Allocate two qubits for the Bell state.
    use (q1, q2) = (Qubit(), Qubit());

    // Prepare the Bell state |Φ⁺⟩ = (|00⟩+|11⟩)/√2.
    H(q1);
    CNOT(q1, q2);

    // Measure both qubits and reset them.
    let result1 = MResetZ(q1);
    let result2 = MResetZ(q2);

    // Return the measurement results.
    (result1, result2)
}
```