```qsharp
/// # Summary
/// Generates a random classical bit using a qubit measurement.
operation GenerateRandomClassicalBit() : Result {
    // Allocate a qubit
    use q = Qubit();
    // Set the qubit into uniform superposition of |0〉 and |1〉
    H(q);
    // Measure and reset the qubit. Return the result.
    MResetZ(q)
}
```