import { EngineConfiguration } from "../src/EngineConfiguration";
import { Engine } from "../src/Engine";
import {ValueContainer} from "../src/ValueContainer";
import * as ts from "typescript/lib/tsserverlibrary";
import OpenFileInfoTelemetryEvent = ts.server.OpenFileInfoTelemetryEvent;
import {Big} from "big.js";

describe("the engine", function () {
    let engine: Engine;
    beforeAll(() => {
        global.requestAnimationFrame = function (callback: any) {
            setTimeout(() => {
                callback(100);
            });
            return 0;
        }
    });
    beforeEach(() => {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            string: "string",
            number: 1,
            boolean: true,
            object: {}
        }));
    });
    it("creates a container for declared string global properties", function () {
        expect(engine.globals.string).toBeDefined();
        expect(engine.globals.string).toEqual("string");
    });
    it("creates a container for declared boolean global properties", function () {
        expect(engine.globals.boolean).toBeDefined();
        expect(engine.globals.boolean).toEqual(true);
    });
    it("creates a container for declared number global properties", function () {
        expect(engine.globals.number).toBeDefined();
        expect(engine.globals.number).toEqual(Big(1));
    });
    it("creates a container for declared object global properties", function () {
        expect(engine.globals.object).toMatchObject({});
    });
    it("calls update on all reference each tick", function () {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            object: {
                updated: EngineConfiguration.configProperty(0, (current:any) => {
                    return current.add(1);
                })
            }
        }));
        (<any>engine).state = "running";
        engine.tick(0);
        expect(() => engine.tick(1000)).not.toThrow();
        expect(engine.globals.object.updated).toEqual(Big(1));
    });
    it("can be paused", function () {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            object: {
                updated: EngineConfiguration.configProperty(0, (current:any) => {
                    return current + 1;
                })
            }
        }));
        engine.start();
        engine.pause();
        expect(engine.globals.object.updated).toEqual(Big(0));
    })
});

describe("Managed values", function () {
    let engine: Engine;
    beforeAll(() => {
        global.requestAnimationFrame = function (callback: any) {
            setTimeout(() => {
                callback(100);
            });
            return 0;
        }
    });
    beforeEach(() => {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            string: "string",
            number: 1,
            boolean: true,
            object: {},
            withUpdater: {
                updater: EngineConfiguration.configProperty(null, (a: any, b?:any, c?:Engine) => <any>null)
            },
            withStartingValue: EngineConfiguration.configProperty(2)
        }));
        if(engine === undefined) {
            throw new Error();
        }
    });
    it("throws an exception when created without a configuration", function () {
        expect(()=>new Engine(<any>undefined)).toThrow();
    })
    it("takes a string or number as a starting value", function () {
        expect(engine.globals.string).toBe("string");
        expect(engine.globals.number).toEqual(new Big(1));
    });
    it("can create a value on the fly", function () {
        engine = new Engine(new EngineConfiguration());
        const ref = engine.createReference({
            startingValue: [{startingValue: 1}]
        })
        expect([...ref]).toEqual([Big(1)]);
    });
    it("does not call listeners when update does not change a value", function () {
        const watcher = jest.fn();
        engine.globals.withUpdater.watch(watcher);
        (<any>engine).state = "running";
        engine.tick(100);
        engine.tick(200);
        expect(watcher).toHaveBeenCalledTimes(1);
    });
    it("calls any defined postConfigurationHooks", function () {
        const hook = jest.fn();
        new Engine(new EngineConfiguration()
            .WithGlobalProperties(EngineConfiguration.configProperty({})
                .withPostConfigurationHook(hook)));
        expect(hook).toHaveBeenCalled();
    });
});