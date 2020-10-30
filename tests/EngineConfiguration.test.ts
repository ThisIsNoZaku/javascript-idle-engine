import {EngineConfiguration} from "../src/EngineConfiguration";
import {PropertyConfiguration} from "../src/PropertyConfiguration";

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
            startingValue: 1
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
            startingValue: 1
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
                            startingValue: 1
                        },
                        nestedBoolean: {
                            startingValue: true
                        },
                        nestedObject: {
                            startingValue: {
                                furtherNested: {
                                    startingValue: 1
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
                    startingValue: 1
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
            existingConfig : EngineConfiguration.configProperty({}, ()=>{})
        });
        expect(Object.assign({}, config)).toMatchObject(Object.assign({}, {
            startingValue: {
                object: {
                    startingValue: {
                        nestedString: {
                            startingValue: "nestedString",
                        },
                        nestedNumber: {
                            startingValue: 1
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
    })
})