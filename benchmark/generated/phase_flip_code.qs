```qsharp
/// # Summary
/// Demonstrates encoding and decoding a logical qubit using the phase-flip code.
///
/// # Description
/// This Q# program encodes a logical qubit using the phase-flip code, 
/// introduces a phase-flip error, and then decodes it back to the original state.
operation Main() : Unit {
    use logicalQubit = Qubit[3];

    // Set the initial state of the first physical qubit.
    PrepareInitialState(logicalQubit[0]);

    // Encode the logical qubit using the phase-flip code.
    EncodeLogicalQubit(logicalQubit[0], logicalQubit[1...]);

    // Introduce a phase-flip error on a random qubit.
    IntroducePhaseFlipError(logicalQubit);

    // Correct the phase-flip error.
    CorrectPhaseFlipError(logicalQubit);

    // Decode the logical qubit back to a single physical qubit.
    DecodeLogicalQubit(logicalQubit[0], logicalQubit[1...]);

    // Measure and reset the physical qubit before releasing it.
    let result = M(logicalQubit[0]);
    ResetAll(logicalQubit);
    Message($"Decoded logical qubit measurement: {result}");
}

/// Prepares the initial state of the qubit.
operation PrepareInitialState(q : Qubit) : Unit {
    // Example: Prepare the qubit in a superposition state.
    H(q);
}

/// Encodes a logical qubit using the phase-flip code.
operation EncodeLogicalQubit(physicalQubit : Qubit, aux : Qubit[]) : Unit is Adj {
    ApplyToEachA(CNOT(physicalQubit, _), aux);
    ChangeBasis([physicalQubit] + aux);
}

/// Decodes a logical qubit using the phase-flip code.
operation DecodeLogicalQubit(physicalQubit : Qubit, aux : Qubit[]) : Unit is Adj {
    Adjoint EncodeLogicalQubit(physicalQubit, aux);
}

/// Introduces a phase-flip error on a random qubit.
operation IntroducePhaseFlipError(logicalQubit : Qubit[]) : Unit {
    let index = DrawRandomInt(0, Length(logicalQubit) - 1);
    Z(logicalQubit[index]);
}

/// Corrects a phase-flip error in a logical qubit.
operation CorrectPhaseFlipError(logicalQubit : Qubit[]) : Unit {
    Fact(Length(logicalQubit) == 3, "`logicalQubit` must be length 3");

    use aux = Qubit[2];
    ChangeBasis(logicalQubit);
    CNOT(logicalQubit[0], aux[0]);
    CNOT(logicalQubit[1], aux[0]);
    CNOT(logicalQubit[1], aux[1]);
    CNOT(logicalQubit[2], aux[1]);
    ChangeBasis(logicalQubit);

    let (parity01, parity12) = (M(aux[0]), M(aux[1]));
    ResetAll(aux);

    let indexOfError = if (parity01, parity12) == (One, Zero) {
        0
    } elif (parity01, parity12) == (One, One) {
        1
    } elif (parity01, parity12) == (Zero, One) {
        2
    } else {
        -1
    };

    if indexOfError > -1 {
        Z(logicalQubit[indexOfError]);
    }
}

/// Changes the basis of the given qubits by applying a Hadamard operation to each of them.
operation ChangeBasis(qs : Qubit[]) : Unit is Adj {
    ApplyToEachA(H, qs);
}
```