```qsharp
/// # Summary
/// Implements a swap test to compare two single-qubit states.
/// The swap test is a quantum algorithm used to determine the similarity
/// between two quantum states. It uses an ancillary qubit to perform
/// the test and measures the probability of the ancillary qubit being
/// in the |0⟩ state after the test.
///
/// # Input
/// ## q1
/// The first qubit to compare.
///
/// ## q2
/// The second qubit to compare.
///
/// # Output
/// Returns the result of the measurement of the ancillary qubit.
operation SwapTest(q1 : Qubit, q2 : Qubit) : Result {
    use ancilla = Qubit();

    // Prepare the ancilla qubit in the |+⟩ state
    H(ancilla);

    // Apply controlled-SWAP (Fredkin gate) using the ancilla as control
    Controlled SWAP([ancilla], (q1, q2));

    // Apply Hadamard to the ancilla qubit
    H(ancilla);

    // Measure the ancilla qubit
    let result = M(ancilla);

    // Reset the ancilla qubit
    Reset(ancilla);

    // Return the measurement result
    return result;
}
```