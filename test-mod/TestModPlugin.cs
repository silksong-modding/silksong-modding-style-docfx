namespace TestMod;

public class TestModPlugin
{
    /// <summary>
    /// A property for testing purposes.
    /// </summary>
    public static string TestProp { get; set; }

    /// <summary>
    /// This is a test function with test documentation.
    /// </summary>
    /// <param name="number">Some parameter that does something.</param>
    public static void TestFunc(int number) {}

    /// <summary>
    /// A nested class of some kind.
    /// </summary>
    public class NestedClass {
        /// <summary>
        /// A field for testing purposes.
        /// </summary>
        public int testField = 2;
    }
}
