import { EngineConfiguration } from "../src/EngineConfiguration";

describe("the engine configuration", function() {
    var configuration: EngineConfiguration;
    beforeEach(() => {
        configuration = new EngineConfiguration()
            .WithGlobalProperties({
                property: "aString",
                array: ["s", 1, true, {startingValue: 2}, {startingValue: {}}]
        });
    });
    it("has a global property declaration object", function() {
        expect(configuration.globals).not.toBeUndefined();
    })
    it("can declare a global property", function() {
        expect(configuration.globals["property"]).not.toBeUndefined();
    });
    it("recursively transforms declaration in arrays", function () {
        expect(configuration.globals.array.startingValue[0]).toEqual({
            startingValue: "s"
        });
        expect(configuration.globals.array.startingValue[1]).toEqual({
            startingValue: 1
        });
        expect(configuration.globals.array.startingValue[2]).toEqual({
            startingValue: true
        });
        expect(configuration.globals.array.startingValue[3]).toEqual({
            startingValue: 2
        });
        expect(configuration.globals.array.startingValue[4]).toEqual({
            startingValue: {}
        });
    })
});