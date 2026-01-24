```qsharp
/// # Summary
/// Implements the Bernstein-Vazirani algorithm for a 3-bit secret.
/// This algorithm determines the value of a bit string encoded in a function.
operation Main() : Int[] {
    let nQubits = 3;

    // Define the 3-bit secret as an integer.
    let secret = 5; // Binary representation: 101

    // Create an operation that encodes the bit string represented by the integer as a parity operation.
    let parityOperation = EncodeIntegerAsParityOperation(secret);

    // Use the Bernstein-Vazirani algorithm to determine the bit string.
    let decodedBitString = BernsteinVazirani(parityOperation, nQubits);
    let decodedInteger = ResultArrayAsInt(decodedBitString);

    Message($"Decoded integer: {decodedInteger}");
    return [decodedInteger];
}

/// # Summary
/// This operation implements the Bernstein-Vazirani quantum algorithm.
/// This algorithm computes for a given Boolean function that is promised to
/// be a parity 𝑓(𝑥₀, …, 𝑥ₙ₋₁) = Σᵢ 𝑟ᵢ 𝑥ᵢ a result in the form of a bit
/// vector (𝑟₀, …, 𝑟ₙ₋₁) corresponding to the parity function.
operation BernsteinVazirani(Uf : ((Qubit[], Qubit) => Unit), n : Int) : Result[] {
    use queryRegister = Qubit[n];
    use target = Qubit();

    X(target);

    within {
        ApplyToEachA(H, queryRegister);
    } apply {
        H(target);
        Uf(queryRegister, target);
    }

    let resultArray = MResetEachZ(queryRegister);
    Reset(target);

    return resultArray;
}

/// # Summary
/// Given an integer that can be represented as a bit string
/// 𝑟⃗ = (r₀, …, rₙ₋₁), this operation applies a unitary 𝑈 that acts on 𝑛 + 1
/// qubits as:
///     𝑈 |𝑥〉|𝑦〉 = |𝑥〉|𝑦 ⊕ 𝑓(𝑥)〉
/// where 𝑓(𝑥) = Σᵢ 𝑥ᵢ 𝑟ᵢ mod 2.
operation ApplyParityOperation(
    bitStringAsInt : Int,
    xRegister : Qubit[],
    yQubit : Qubit
) : Unit {
    let requiredBits = BitSizeI(bitStringAsInt);
    let availableQubits = Length(xRegister);
    Fact(
        availableQubits >= requiredBits,
        $"Integer value {bitStringAsInt} requires {requiredBits} bits to be represented but the quantum register only has {availableQubits} qubits"
    );

    for index in IndexRange(xRegister) {
        if ((bitStringAsInt &&& 2^index) != 0) {
            CNOT(xRegister[index], yQubit);
        }
    }
}

/// # Summary
/// Returns black-box operations (Qubit[], Qubit) => () of the form
/// U_f |𝑥〉|𝑦〉 = |𝑥〉|𝑦 ⊕ 𝑓(𝑥)〉.
/// We define 𝑓 by providing the bit string 𝑟⃗ as an integer.
function EncodeIntegerAsParityOperation(bitStringAsInt : Int) : (Qubit[], Qubit) => Unit {
    return ApplyParityOperation(bitStringAsInt, _, _);
}
```