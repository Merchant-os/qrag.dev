using Microsoft.Quantum.Simulation.Core;
using Microsoft.Quantum.Simulation.Simulators;
using Xunit;

public class GeneratedTests
{
    [Fact]
    public async System.Threading.Tasks.Task TaskSimpleAdder()
    {
        using var sim = new QuantumSimulator();
        await Generated.TaskSimpleAdder.Run(sim);
    }
}
