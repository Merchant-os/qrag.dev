namespace Generated {
    open Microsoft.Quantum.Intrinsic;
    open Microsoft.Quantum.Measurement;
    open Microsoft.Quantum.Math;

    operation TaskSimpleAdder() : Unit {
        use (a, b, carry) = (Qubit(), Qubit(), Qubit());

        // Initialize qubits to represent the input bits
        // For example, let's assume a = 1, b = 1
        X(a);
        X(b);

        // Apply the quantum adder logic
        CNOT(a, carry);
        CNOT(b, carry);
        CNOT(a, b);

        // Measure the result
        let sum = MResetZ(b);
        let carryOut = MResetZ(carry);

        // Reset the input qubits
        _ <- MResetZ(a);

        // Output the result
        Message($"Sum: {sum}, Carry: {carryOut}");
    }
}
