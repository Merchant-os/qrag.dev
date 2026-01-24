```qsharp
/// # Summary
/// Prepares a single qubit in uniform superposition and measures it.
operation PrepareAndMeasureQubit() : Result {
    // Allocate a single qubit
    use q = Qubit();
    
    // Apply the Hadamard gate to put the qubit in superposition
    H(q);
    
    // Measure the qubit and reset it to |0⟩ state
    let result = MResetZ(q);
    
    // Return the measurement result
    return result;
}
```