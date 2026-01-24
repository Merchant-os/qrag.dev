```qsharp
/// # Summary
/// This operation encodes a logical qubit using the 3-qubit bit-flip code.
/// The logical qubit is encoded into three physical qubits to protect against
/// a single bit-flip error.
///
/// # Input
/// ## logicalQubit
/// The qubit to be encoded. It is assumed to be in the |0⟩ or |1⟩ state.
///
/// ## aux
/// The auxiliary qubits that will be used as part of the encoding. These
/// should be grouped with the `logicalQubit` to form the logical qubit.
operation EncodeBitFlip(logicalQubit : Qubit, aux : Qubit[]) : Unit is Adj {
    Fact(Length(aux) == 2, "`aux` must be length 2");

    // Copy the state of the logical qubit to the auxiliary qubits
    CNOT(logicalQubit, aux[0]);
    CNOT(logicalQubit, aux[1]);
}

/// # Summary
/// This operation decodes a logical qubit that was encoded using the 3-qubit
/// bit-flip code. It assumes that the logical qubit is encoded into three
/// physical qubits.
///
/// # Input
/// ## logicalQubit
/// The register of three physical qubits representing a single logical qubit.
operation DecodeBitFlip(logicalQubit : Qubit[]) : Unit is Adj {
    Fact(Length(logicalQubit) == 3, "`logicalQubit` must be length 3");

    // Decode the logical qubit by reversing the encoding process
    CNOT(logicalQubit[0], logicalQubit[1]);
    CNOT(logicalQubit[0], logicalQubit[2]);
}

/// # Summary
/// This operation corrects a single bit-flip error for a logical qubit
/// encoded as three physical qubits using the 3-qubit bit-flip code.
///
/// # Input
/// ## logicalQubit
/// The register of three physical qubits representing a single logical qubit.
operation CorrectBitFlipError(logicalQubit : Qubit[]) : Unit {
    Fact(Length(logicalQubit) == 3, "`logicalQubit` must be length 3");

    // Measure the parity of the qubits to detect a bit-flip error
    use aux = Qubit();
    CNOT(logicalQubit[0], aux);
    CNOT(logicalQubit[1], aux);
    let parity01 = M(aux);
    Reset(aux);

    CNOT(logicalQubit[1], aux);
    CNOT(logicalQubit[2], aux);
    let parity12 = M(aux);
    Reset(aux);

    // Determine which qubit has the error based on the parity measurements
    let indexOfError = if (parity01, parity12) == (One, Zero) {
        0
    } elif (parity01, parity12) == (One, One) {
        1
    } elif (parity01, parity12) == (Zero, One) {
        2
    } else {
        -1
    };

    // Correct the error if detected
    if indexOfError > -1 {
        X(logicalQubit[indexOfError]);
    }
}

/// # Summary
/// Demonstrates encoding, error correction, and decoding of a logical qubit
/// using the 3-qubit bit-flip code.
operation Main() : Unit {
    use logicalQubit = Qubit[3];

    // Prepare the logical qubit in the |1⟩ state
    X(logicalQubit[0]);

    // Encode the logical qubit
    EncodeBitFlip(logicalQubit[0], logicalQubit[1...]);

    // Introduce a bit-flip error on a random qubit
    X(logicalQubit[DrawRandomInt(0, 2)]);

    // Correct the bit-flip error
    CorrectBitFlipError(logicalQubit);

    // Decode the logical qubit
    Adjoint EncodeBitFlip(logicalQubit[0], logicalQubit[1...]);

    // Measure and reset the logical qubit
    let result = M(logicalQubit[0]);
    ResetAll(logicalQubit);

    Message($"Decoded logical qubit: {result}");
}
```