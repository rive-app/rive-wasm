// Checks that the loaded wasm module provides what rive_advanced.mjs.d.ts
// promises. `npm test` and `npm run test:matrix` run it on every build, so a
// binding renamed or dropped in one build only fails here instead of at
// runtime in an app.
import fs from "fs";
import path from "path";
import ts from "typescript";
import * as rive from "../src/rive";
import { riveBuild } from "./buildFeatures";

// What each build doesn't provide of what the declarations promise. An entry
// that a build does provide fails the test, so the lists can't go stale.
// A value_object: embind converts it to a plain object and registers no class.
const declaredOnly = ["AABB"];
const canvas2dOnly = [
  "CanvasRenderer",
  "renderFactory",
  "BlendMode",
  "FillRule",
  "RenderPaintStyle",
  "StrokeCap",
  "StrokeJoin",
  "StrokePosition",
  "ImageFilter",
  "ImageWrap",
  "cleanup",
];
const missingMembers: Record<string, string[]> = {
  canvas: declaredOnly,
  canvas_fallback: declaredOnly,
  lite: declaredOnly,
  webgl2: [
    ...declaredOnly,
    ...canvas2dOnly,
    // Bug: rive.ts disableFPSCounter() calls it, but webgl2_renderer.js only
    // defines enableFPSCounter.
    "disableFPSCounter",
  ],
};
// Declared classes the module doesn't register under their own name: types
// for JS-side wrappers, enums and objects reached only through other calls.
const unregisteredClasses = [
  "Audio",
  "AudioAssetInternal",
  "AudioInternal",
  "AlignmentFactory",
  "CanvasRenderPaint",
  "CanvasRenderPath",
  "CommandPath",
  "DataEnum",
  "FileAssetInternal",
  "Font",
  "FontAssetInternal",
  "FontInternal",
  "Image",
  "ImageAssetInternal",
  "ImageInternal",
];
// On the canvas builds, embind bases that wasm/js/renderer.js subclasses
// (allow_subclass in bindings_c2d.cpp). Their declared methods are what the JS
// subclass implements, so they're checked on CanvasRenderer, not on the bases.
// webgl2 binds Renderer natively, so it's checked there.
const subclassedInJs = [
  "Renderer",
  "RendererWrapper",
  "RenderImage",
  "RenderImageWrapper",
  "RenderPaint",
  "RenderPaintWrapper",
  "RenderPath",
  "RenderPathWrapper",
];
const canvas2dOnlyClasses = [
  "RendererWrapper",
  "RenderPaint",
  "RenderPaintWrapper",
  "RenderPath",
  "RenderPathWrapper",
];
// Declared on the wrong class: bound on LinearAnimation, StateMachine,
// SMIBool/SMINumber and ViewModel, or kept on the JS-side Rive and asset
// wrappers rather than the wasm objects.
const misplacedProperties = [
  "Alignment.prototype.x",
  "Alignment.prototype.y",
  "Artboard.prototype.artboardHeight",
  "Artboard.prototype.artboardWidth",
  "Artboard.prototype.devicePixelRatioUsed",
  "AudioAsset.prototype.nativeAsset",
  "FileAsset.prototype.nativeAsset",
  "FontAsset.prototype.nativeAsset",
  "ImageAsset.prototype.nativeAsset",
  "LinearAnimationInstance.prototype.duration",
  "LinearAnimationInstance.prototype.fps",
  "LinearAnimationInstance.prototype.loopValue",
  "LinearAnimationInstance.prototype.name",
  "LinearAnimationInstance.prototype.speed",
  "LinearAnimationInstance.prototype.workEnd",
  "LinearAnimationInstance.prototype.workStart",
  "SMIInput.prototype.value",
  "StateMachineInstance.prototype.name",
  "ViewModelInstance.prototype.propertyCount",
];
const missingProperties: Record<string, string[]> = {
  canvas: misplacedProperties,
  canvas_fallback: misplacedProperties,
  lite: misplacedProperties,
  webgl2: misplacedProperties,
};
const missingClasses: Record<string, string[]> = {
  canvas: [],
  canvas_fallback: [],
  lite: [],
  webgl2: canvas2dOnlyClasses,
};
// Bound on SMITrigger, reached through SMIInput.asTrigger().
const smiInputFire = "SMIInput.prototype.fire";
const missingMethods: Record<string, string[]> = {
  canvas: [smiInputFire],
  canvas_fallback: [smiInputFire],
  lite: [smiInputFire],
  webgl2: [
    smiInputFire,
    // Declared for the canvas renderer. webgl2 binds clear and flush on its
    // WebGL2Renderer subclass, and has no beginFrame, rotate or translate.
    "Renderer.prototype.beginFrame",
    "Renderer.prototype.clear",
    "Renderer.prototype.flush",
    "Renderer.prototype.rotate",
    "Renderer.prototype.translate",
  ],
};

const declarations = ts.createSourceFile(
  "rive_advanced.mjs.d.ts",
  fs.readFileSync(path.join(__dirname, "../src/rive_advanced.mjs.d.ts"), "utf8"),
  ts.ScriptTarget.Latest,
);

const memberName = (member: ts.ClassElement | ts.TypeElement) =>
  member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;

const isOptional = (member: ts.ClassElement | ts.TypeElement) =>
  "questionToken" in member && !!member.questionToken;

const isStatic = (member: ts.ClassElement) =>
  !!ts.getModifiers?.(member as ts.HasModifiers)?.some(
    (m) => m.kind === ts.SyntaxKind.StaticKeyword,
  );

const riveCanvas = declarations.statements.find(
  (s): s is ts.InterfaceDeclaration =>
    ts.isInterfaceDeclaration(s) && s.name.text === "RiveCanvas",
)!;

// Members every build must have. Optional members are feature-detected.
const requiredMembers = riveCanvas.members
  .filter((m) => !isOptional(m))
  .map(memberName)
  .filter((name): name is string => !!name);

const classes = new Map(
  declarations.statements
    .filter(ts.isClassDeclaration)
    .filter((c) => !!c.name)
    .map((c) => [c.name!.text, c]),
);

// The declared class this one extends, if it's declared in the same file.
const parentOf = (cls: ts.ClassDeclaration) => {
  const extendsClause = cls.heritageClauses?.find(
    (h) => h.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const parent = extendsClause?.types[0]?.expression;
  return parent && ts.isIdentifier(parent) ? classes.get(parent.text) : undefined;
};

const ownMethods = (cls: ts.ClassDeclaration, statics: boolean) =>
  cls.members
    .filter(ts.isMethodDeclaration)
    .filter((m) => isStatic(m) === statics && !isOptional(m))
    .map(memberName)
    .filter((name): name is string => !!name);

// Instance methods include the ones declared on its parents.
const instanceMethods = (cls: ts.ClassDeclaration): string[] => {
  const parent = parentOf(cls);
  return [...ownMethods(cls, false), ...(parent ? instanceMethods(parent) : [])];
};

const isSubclassedInJs = (name: string) =>
  riveBuild !== "webgl2" && subclassedInJs.includes(name);

const isAccessor = (
  m: ts.ClassElement,
): m is ts.PropertyDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration =>
  ts.isPropertyDeclaration(m) || ts.isGetAccessor(m) || ts.isSetAccessor(m);

// Declared instance properties, including the ones declared on its parents.
// Only presence is checked: embind gives read-only properties a setter that
// throws, so writability can't be read without calling it.
const ownProperties = (cls: ts.ClassDeclaration, statics: boolean) =>
  cls.members
    .filter(isAccessor)
    .filter((m) => isStatic(m) === statics && !isOptional(m))
    .map(memberName)
    .filter((name): name is string => !!name);

const instanceProperties = (cls: ts.ClassDeclaration): string[] => {
  const parent = parentOf(cls);
  return [...ownProperties(cls, false), ...(parent ? instanceProperties(parent) : [])];
};

// Looks a property up through the prototype chain without calling a getter.
const descriptorOf = (
  object: object | null,
  name: string,
): PropertyDescriptor | undefined => {
  for (let o = object; o; o = Object.getPrototypeOf(o)) {
    const descriptor = Object.getOwnPropertyDescriptor(o, name);
    if (descriptor) return descriptor;
  }
  return undefined;
};

let runtime: Record<string, any>;

beforeAll(async () => {
  runtime = (await rive.RuntimeLoader.awaitInstance()) as unknown as Record<
    string,
    any
  >;
});

test("the declarations were parsed", () => {
  expect(requiredMembers.length).toBeGreaterThan(20);
  expect(classes.size).toBeGreaterThan(20);
});

test("the module has every required RiveCanvas member", () => {
  const missing = requiredMembers.filter((name) => runtime[name] === undefined);
  expect(missing.sort()).toEqual([...missingMembers[riveBuild]].sort());
});

test("the module registers every declared class", () => {
  const missing = [...classes.keys()].filter(
    (name) =>
      runtime[name] === undefined &&
      !unregisteredClasses.includes(name) &&
      // Reported by the member test above.
      !requiredMembers.includes(name),
  );
  expect(missing.sort()).toEqual([...missingClasses[riveBuild]].sort());
});

test("registered classes have their declared methods", () => {
  const missing: string[] = [];
  for (const [name, cls] of classes) {
    const runtimeClass = runtime[name];
    if (typeof runtimeClass !== "function" || isSubclassedInJs(name)) {
      continue;
    }
    for (const method of new Set(instanceMethods(cls))) {
      if (typeof runtimeClass.prototype?.[method] !== "function") {
        missing.push(`${name}.prototype.${method}`);
      }
    }
    for (const method of ownMethods(cls, true)) {
      if (typeof runtimeClass[method] !== "function") {
        missing.push(`${name}.${method}`);
      }
    }
  }
  expect(missing.sort()).toEqual([...missingMethods[riveBuild]].sort());
});

test("registered classes have their declared properties", () => {
  const missing: string[] = [];
  for (const [name, cls] of classes) {
    const runtimeClass = runtime[name];
    if (typeof runtimeClass !== "function" || isSubclassedInJs(name)) {
      continue;
    }
    for (const property of new Set(instanceProperties(cls))) {
      if (!descriptorOf(runtimeClass.prototype, property)) {
        missing.push(`${name}.prototype.${property}`);
      }
    }
    for (const property of ownProperties(cls, true)) {
      if (!descriptorOf(runtimeClass, property)) {
        missing.push(`${name}.${property}`);
      }
    }
  }
  expect(missing.sort()).toEqual([...missingProperties[riveBuild]].sort());
});

// Declared but not in renderer.js: paths are cleared with rewind(), and
// paints no longer draw themselves.
const staleRenderFactoryMethods = [
  "CanvasRenderPaint.prototype.draw",
  "CanvasRenderPath.prototype.reset",
];

// CanvasRenderPaint and CanvasRenderPath are defined inside renderer.js and
// not registered on the module, so their methods are checked on the objects
// renderFactory makes. webgl2 has no renderFactory.
(riveBuild === "webgl2" ? test.skip : test)(
  "renderFactory objects have their declared methods",
  () => {
    const made: Record<string, any> = {
      CanvasRenderPaint: runtime.renderFactory.makeRenderPaint(),
      CanvasRenderPath: runtime.renderFactory.makeRenderPath(),
    };
    const missing: string[] = [];
    for (const [name, object] of Object.entries(made)) {
      for (const method of new Set(instanceMethods(classes.get(name)!))) {
        if (typeof object[method] !== "function") {
          missing.push(`${name}.prototype.${method}`);
        }
      }
      object.delete();
    }
    expect(missing.sort()).toEqual(staleRenderFactoryMethods);
  },
);
