```qsharp
/// # Summary
/// Implements the Quantum Fourier Transform (QFT) on 3 qubits.
/// The QFT is a key algorithm in quantum computing, used in various applications
/// such as phase estimation and Shor's algorithm.
operation QuantumFourierTransform3(qubits : Qubit[]) : Unit {
    Fact(Length(qubits) == 3, "`qubits` must be of length 3");

    // Apply the Hadamard gate to the first qubit
    H(qubits[0]);

    // Apply controlled phase rotations
    R1Frac(2, 2, qubits[1], qubits[0]);
    R1Frac(3, 2, qubits[2], qubits[0]);

    // Apply the Hadamard gate to the second qubit
    H(qubits[1]);

    // Apply controlled phase rotation
    R1Frac(2, 2, qubits[2], qubits[1]);

    // Apply the Hadamard gate to the third qubit
    H(qubits[2]);

    // Swap the qubits to complete the QFT
    SWAP(qubits[0], qubits[2]);
}

/// # Summary
/// Demonstrates the Quantum Fourier Transform on 3 qubits.
operation Main() : Unit {
    use qubits = Qubit[3];

    // Prepare the qubits in a superposition state
    H(qubits[0]);
    H(qubits[1]);
    H(qubits[2]);

    // Apply the Quantum Fourier Transform
    QuantumFourierTransform3(qubits);

    // Measure the qubits to observe the result
    let results = MResetZ(qubits);

    // Output the measurement results
    Message($"QFT results: {results}");
}
```