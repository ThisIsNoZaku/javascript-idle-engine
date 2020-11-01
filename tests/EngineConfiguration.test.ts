import {EngineConfiguration} from "../src/EngineConfiguration";
import {Big} from "big.js";
import {Engine} from "../src";

describe("the engine configuration", function () {
    var configuration: EngineConfiguration;
    beforeEach(() => {
        configuration = new EngineConfiguration()
            .WithGlobalProperties({
                property: "aString",
                array: ["s", 1, true, {}]
            });
    });
    it("has a global property declaration object", function () {
        expect(configuration.globals).not.toBeUndefined();
    })
    it("recursively transforms declaration in arrays", function () {
        expect(configuration.globals.array.startingValue[0]).toMatchObject({
            startingValue: "s"
        });
        expect(configuration.globals.array.startingValue[1]).toEqual({
            startingValue: Big(1)
        });
        expect(configuration.globals.array.startingValue[2]).toEqual({
            startingValue: true
        });
        expect(configuration.globals.array.startingValue[3]).toEqual({
            startingValue: {}
        });
    });
});
describe("configProperty helper", function () {
    it("returns a configuration with the given string as the startingValue", function () {
        const config = EngineConfiguration.configProperty("string");
        expect(config).toEqual({
            startingValue: "string"
        });
    });
    it("returns a configuration with the given number as the starting value", function () {
        const config = EngineConfiguration.configProperty(1);
        expect(config).toEqual({
            startingValue: Big(1)
        });
    });
    it("returns a configuration with the given boolean as the starting value", function () {
        const config = EngineConfiguration.configProperty(true);
        expect(config).toEqual({
            startingValue: true
        });
    });
    it("recursively transforms the children of an object", function () {
        const config = EngineConfiguration.configProperty({
            object: {
                nestedString: "nestedString",
                nestedNumber: 1,
                nestedBoolean: true,
                nestedObject: {
                    furtherNested: 1
                }
            }
        });
        expect(config).toEqual({
            startingValue: {
                object: {
                    startingValue: {
                        nestedString: {
                            startingValue: "nestedString",
                        },
                        nestedNumber: {
                            startingValue: Big(1)
                        },
                        nestedBoolean: {
                            startingValue: true
                        },
                        nestedObject: {
                            startingValue: {
                                furtherNested: {
                                    startingValue: Big(1)
                                }
                            }
                        }
                    }
                }
            }
        });
    });
    it("recursively transforms the values in an array", function () {
        const config = EngineConfiguration.configProperty([1]);
        expect(config).toEqual({
            startingValue: [
                {
                    startingValue: Big(1)
                }
            ]
        })
    });
    it("uses an existing configuration object", function () {
        const config = EngineConfiguration.configProperty({
            object: {
                nestedString: "nestedString",
                nestedNumber: 1,
                nestedBoolean: true,
            },
            existingConfig: EngineConfiguration.configProperty({}, () => {
            })
        });
        expect(Object.assign({}, config)).toMatchObject(Object.assign({}, {
            startingValue: {
                object: {
                    startingValue: {
                        nestedString: {
                            startingValue: "nestedString",
                        },
                        nestedNumber: {
                            startingValue: Big(1)
                        },
                        nestedBoolean: {
                            startingValue: true
                        }
                    }
                },
                existingConfig: {
                    startingValue: {},
                    updater: expect.any(Function)
                }
            }
        }));
    });
    it("adding a listener to a non-object, non-array value throws an error", function () {
        expect(() => {
            EngineConfiguration.configProperty(0).withListener(jest.fn())
        }).toThrow();
    });
    it("can add a listener to a property", function () {
        const listener = jest.fn();
        const engine = new Engine(new EngineConfiguration()
            .WithGlobalProperties({
                property: EngineConfiguration.configProperty({}).withListener(listener)
            }));
        engine.globals.property.foo = "bar";
        expect(listener.mock.calls[0][0]).toBe("foo");
        expect(listener.mock.calls[0][1]).toBe("bar");
    });
    it("doesn't process function properties", function () {
        const engine = new Engine(new EngineConfiguration()
            .WithGlobalProperties({
                property: function () {

                }
            }));
        expect(typeof engine.globals.property).toEqual("function");
    })
})