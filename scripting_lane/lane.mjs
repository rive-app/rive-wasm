// The browser lane for AnimaScript in the JS runtime. Serves the webgl2
// scripting build with COOP/COEP, loads each stress fixture through the
// advanced API in headless Chrome, compares frame N with what rive-cli
// renders on WAMR, and times the frames on both. Both lanes run the .riv
// rive-cli bakes from the fixture's source.
//   node lane.mjs [--swiftshader] [--no-wamr] [--aot] [--out <dir>] [fixture...]
// --swiftshader draws with Chrome's software GL instead of the machine's
// GPU. --no-wamr skips rive-cli, leaving only the browser's own checks on
// the committed .riv files.
// --aot also benches the WAMR AOT tier, with the patched wamrc RIVE_WAMRC
// names. --out keeps the frames, else they go to a temp dir.
import { chromium } from 'playwright-core';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import http from 'http';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = fileURLToPath(new URL('.', import.meta.url));
const packages = resolve(here, '../..');
const build = join(packages, 'runtime_wasm/wasm/build/webgl2_scripting/bin/release');
const stress = join(packages, 'runtime/tests/web_scripting/stress');
// A debug rive-cli runs librive and WAMR unoptimized, which skews the timings.
const cli = process.env.RIVE_CLI ?? join(packages, 'rive-cli/out/release/rive');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => args[args.indexOf(name) + 1];
const swiftshader = flag('--swiftshader');
const wamr = !flag('--no-wamr');
const aot = flag('--aot');
const out = flag('--out') ? resolve(option('--out')) : mkdtempSync(join(tmpdir(), 'rive-lane-'));
const named = args.filter((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--out');
const fixtures = named.length > 0 ? named : ['gpu_canvas', 'big_path', 'mesh', 'data_list', 'text'];

// Frame N is compared across lanes; the timed frames follow a warmup as long
// as rive-cli's --bench uses.
const kFrame = 60;
const kWarmup = 300;
const kTimed = 300;
// A channel within this of the WAMR render matches. GPUs differ in
// rounding, so a few pixels may still not.
const kChannelTolerance = 24;
const kMismatchBudget = 0.0075;

if (aot && !wamr) {
    console.error('--aot benches WAMR, which --no-wamr skips');
    process.exit(1);
}
mkdirSync(out, { recursive: true });
if (!existsSync(join(build, 'webgl2_advanced.mjs'))) {
    console.error(`no build at ${build}, see the README`);
    process.exit(1);
}
if (wamr && !existsSync(cli)) {
    console.error(`no rive-cli at ${cli}; build it or pass --no-wamr`);
    process.exit(1);
}
if (aot && !process.env.RIVE_WAMRC) {
    console.error('--aot needs RIVE_WAMRC naming a wamrc built from our patched WAMR');
    process.exit(1);
}

// The bake the committed .riv files come from, kept in out/projects with its
// staged projects.
const projects = join(out, 'projects');
function bake() {
    const run = spawnSync(join(stress, 'bake.sh'), fixtures, {
        env: { ...process.env, RIVE_BAKE_OUT: projects, RIVE_CLI: cli },
        encoding: 'utf8',
    });
    if (run.status !== 0) {
        throw new Error(`stress/bake.sh failed:\n${run.stdout}${run.stderr}`);
    }
}

// RIVE_WAMRC alone turns the AOT ladder on, so only the AOT bench gets it.
function riveCli(dir, extra, aotTier = false) {
    const env = { ...process.env, RIVE_DEV_SKIP_AUTH: '1', RIVE_WASM_AOT_SYNC: 'interp' };
    delete env.RIVE_WAMRC;
    if (aotTier) {
        env.RIVE_WAMRC = process.env.RIVE_WAMRC;
        env.RIVE_WASM_AOT_SYNC = 'o3';
    }
    const run = spawnSync(cli, [dir, '--optimize', ...extra], { cwd: out, env, encoding: 'utf8' });
    const log = run.stdout + run.stderr;
    if (run.status !== 0) {
        throw new Error(`rive-cli failed on ${dir}:\n${log}`);
    }
    return log;
}

// "bench advance: mean 0.123ms p50 0.120ms ..." and the render line.
function benchMs(log) {
    const p50 = (kind) => Number(log.match(new RegExp(`bench ${kind}: .*?p50 ([0-9.]+)ms`))?.[1]);
    const tier = log.match(/bench script tier: (.*)/)?.[1] ?? 'unknown';
    return { advance: p50('advance'), render: p50('render'), tier };
}

const wamrResults = {};
if (wamr) {
    bake();
    for (const name of fixtures) {
        const dir = join(projects, name);
        riveCli(dir, [`--advance=${kFrame}`, `--screenshot=${join(out, `${name}.wamr.png`)}`]);
        if (!readFileSync(join(dir, 'build/app.riv')).equals(readFileSync(`${dir}.riv`))) {
            throw new Error(`rive-cli rendered ${name} from another bake than the browser loads`);
        }
        // --bench rebakes with the release scripts a publish ships, which
        // only drops the throw messages.
        wamrResults[name] = { interp: benchMs(riveCli(dir, [`--bench=${kTimed}`])) };
        if (aot) {
            wamrResults[name].aot = benchMs(riveCli(dir, [`--bench=${kTimed}`], true));
        }
    }
}

const types = { js: 'text/javascript', mjs: 'text/javascript', wasm: 'application/wasm', png: 'image/png' };
const roots = { '/wasm/': build, '/riv/': wamr ? projects : stress, '/out/': out };
const server = http.createServer((req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    const url = req.url.split('?')[0];
    if (url === '/favicon.ico') {
        res.statusCode = 204;
        return res.end();
    }
    if (url === '/') {
        res.setHeader('content-type', 'text/html');
        return res.end('<!doctype html><body></body>');
    }
    for (const [prefix, dir] of Object.entries(roots)) {
        const file = join(dir, url.slice(prefix.length));
        if (url.startsWith(prefix) && existsSync(file)) {
            res.setHeader('content-type', types[url.split('.').pop()] ?? 'application/octet-stream');
            return res.end(readFileSync(file));
        }
    }
    res.statusCode = 404;
    res.end();
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
    // An empty RIVE_LANE_CHANNEL takes Playwright's own Chromium.
    channel: (process.env.RIVE_LANE_CHANNEL ?? 'chrome') || undefined,
    args: swiftshader ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [],
});
const page = await browser.newPage();
const logs = [];
page.on('console', (message) => logs.push(message.text()));
page.on('pageerror', (error) => logs.push('PAGEERROR ' + error.message));
await page.goto(origin + '/');

// Runs in the page: one fixture, fresh canvas and file, the app's load.
async function runFixture({ name, frame, warmup, timed, reference, tolerance }) {
    const { default: Rive } = await import('/wasm/webgl2_advanced.mjs');
    window.rive ??= await Rive({ locateFile: (file) => '/wasm/' + file });
    const rive = window.rive;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    document.body.appendChild(canvas);
    const renderer = rive.makeRenderer(canvas);
    const session = rive.makeDeferredSession();
    const bytes = new Uint8Array(await (await fetch(`/riv/${name}.riv`)).arrayBuffer());
    const file = await rive.load(bytes, undefined, false, session);
    if (!renderer.attachSession(session)) {
        throw new Error('the renderer refused the session');
    }
    const artboard = file.defaultArtboard();
    const machine = artboard.stateMachineCount() > 0
        ? new rive.StateMachineInstance(artboard.stateMachineByIndex(0), artboard)
        : null;
    if (file.viewModelCount() > 0) {
        const instance = file.defaultArtboardViewModel(artboard).defaultInstance();
        (machine ?? artboard).bindViewModelInstance(instance);
    }
    // Image assets decode in the browser after load, into the module's imgs.
    const decodeDeadline = performance.now() + 5000;
    while ([...(rive.images?.values() ?? [])].some((image) => !image.complete)) {
        if (performance.now() > decodeDeadline) {
            throw new Error('image assets did not decode');
        }
        await new Promise((done) => setTimeout(done, 10));
    }
    // rive-cli advances by a float sixtieth.
    const step = Math.fround(1 / 60);
    const bounds = artboard.bounds;
    const advance = () => (machine ? machine.advanceAndApply(step) : artboard.advance(step));
    const render = () => {
        renderer.clear();
        renderer.save();
        renderer.align(rive.Fit.none, rive.Alignment.topLeft,
            { minX: 0, minY: 0, maxX: size, maxY: size }, bounds);
        artboard.draw(renderer);
        renderer.restore();
        renderer.flush();
        rive.resolveAnimationFrame();
    };
    const result = { name };
    for (let i = 0; i < frame; i++) {
        advance();
        render();
    }
    // Copied before the task ends, while the drawing buffer still holds it.
    const shot = document.createElement('canvas');
    shot.width = shot.height = size;
    const context = shot.getContext('2d', { willReadFrequently: true });
    context.drawImage(canvas, 0, 0);
    const pixels = context.getImageData(0, 0, size, size).data;
    result.png = shot.toDataURL('image/png');
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        lit += pixels[i] + pixels[i + 1] + pixels[i + 2] > 48 ? 1 : 0;
    }
    result.litFraction = lit / (size * size);
    if (reference) {
        const image = await createImageBitmap(await (await fetch(reference)).blob());
        context.drawImage(image, 0, 0);
        const want = context.getImageData(0, 0, size, size).data;
        // Rasterizers antialias edges differently, so both frames are
        // compared through a 3x3 box blur.
        const blur = (image) => {
            const out = new Float32Array(size * size * 3);
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    for (let c = 0; c < 3; c++) {
                        let sum = 0;
                        let count = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
                                    sum += image[(ny * size + nx) * 4 + c];
                                    count++;
                                }
                            }
                        }
                        out[(y * size + x) * 3 + c] = sum / count;
                    }
                }
            }
            return out;
        };
        const got = blur(pixels);
        const expected = blur(want);
        let mismatched = 0;
        let total = 0;
        for (let i = 0; i < got.length; i += 3) {
            let worst = 0;
            for (let c = 0; c < 3; c++) {
                const diff = Math.abs(got[i + c] - expected[i + c]);
                worst = Math.max(worst, diff);
                total += diff;
            }
            mismatched += worst > tolerance ? 1 : 0;
        }
        result.mismatchFraction = mismatched / (size * size);
        result.meanDiff = total / (size * size * 3);
    }

    for (let i = 0; i < warmup; i++) {
        advance();
        render();
    }
    const advanceMs = [];
    const renderMs = [];
    for (let i = 0; i < timed; i++) {
        const t0 = performance.now();
        advance();
        const t1 = performance.now();
        render();
        const t2 = performance.now();
        advanceMs.push(t1 - t0);
        renderMs.push(t2 - t1);
    }
    // Counting slows every host call, so it gets a pass of its own.
    const scripting = rive.riveScripting;
    scripting.countHostCalls(true);
    for (let i = 0; i < timed; i++) {
        advance();
        render();
    }
    result.counts = scripting.hostCallCounts();
    scripting.countHostCalls(false);
    // The page's clock ticks in 5 microsecond steps, too coarse for a
    // median of the cheaper frames, so the mean is reported beside it.
    const median = (series) => series.sort((a, b) => a - b)[series.length >> 1];
    const mean = (series) => series.reduce((sum, ms) => sum + ms, 0) / series.length;
    result.advanceMs = median(advanceMs);
    result.renderMs = median(renderMs);
    result.advanceMean = mean(advanceMs);
    result.renderMean = mean(renderMs);
    result.crossOriginIsolated = crossOriginIsolated;

    machine?.delete();
    artboard.delete();
    file.unref();
    renderer.detachSession();
    session.delete();
    renderer.delete();
    canvas.remove();
    return result;
}

let failed = false;
const rows = [];
for (const name of fixtures) {
    const result = await page.evaluate(runFixture, {
        name,
        frame: kFrame,
        warmup: kWarmup,
        timed: kTimed,
        reference: wamr ? `/out/${name}.wamr.png` : null,
        tolerance: kChannelTolerance,
    });
    writeFileSync(join(out, `${name}.web.png`), Buffer.from(result.png.split(',')[1], 'base64'));
    const problems = [];
    if (result.litFraction < 0.05) {
        problems.push(`frame ${kFrame} is blank`);
    }
    if (wamr && !(result.mismatchFraction <= kMismatchBudget)) {
        problems.push(`frame ${kFrame} differs from WAMR on ${(result.mismatchFraction * 100).toFixed(2)}% of pixels`);
    }
    // One entry per VM; the interpreter appends why it runs.
    const tiers = (lane) => wamrResults[name]?.[lane]?.tier.split('; ') ?? [];
    if (wamr && !tiers('interp').every((tier) => tier.startsWith('interp'))) {
        problems.push(`the interp bench ran on ${wamrResults[name].interp.tier}`);
    }
    if (aot && !tiers('aot').every((tier) => tier.startsWith('aot'))) {
        problems.push(`the AOT bench ran on ${wamrResults[name].aot.tier}`);
    }
    failed ||= problems.length > 0;
    rows.push({ name, result, problems });
}
await browser.close();
server.close();

const fixed = (value, digits = 3) => (Number.isFinite(value) ? value.toFixed(digits) : 'n/a');
console.log(`frames in ${out}${swiftshader ? ', SwiftShader' : ''}`);
console.log('| fixture | web advance ms p50 (mean) | web render ms p50 (mean) | host calls/frame | bytes staged/frame | bytes read+written/frame | wamr interp advance ms | wamr interp render ms |' +
    (aot ? ' wamr aot advance ms | wamr aot render ms |' : '') + ' frame match |');
console.log('|---|---|---|---|---|---|---|---|' + (aot ? '---|---|' : '') + '---|');
for (const { name, result, problems } of rows) {
    const counts = result.counts;
    const per = (value) => fixed(value / kTimed, 0);
    const native = wamrResults[name];
    console.log(`| ${name} | ${fixed(result.advanceMs)} (${fixed(result.advanceMean)}) | ` +
        `${fixed(result.renderMs)} (${fixed(result.renderMean)}) | ${per(counts.hostCalls)} | ` +
        `${per(counts.bytesStaged + counts.bytesCopiedOut)} | ${per(counts.bytesRead + counts.bytesWritten)} | ` +
        `${fixed(native?.interp.advance)} | ${fixed(native?.interp.render)} |` +
        (aot ? ` ${fixed(native?.aot?.advance)} | ${fixed(native?.aot?.render)} |` : '') +
        ` ${wamr ? `${fixed(result.mismatchFraction * 100, 2)}% off, mean ${fixed(result.meanDiff, 2)}` : 'skipped'} |`);
    for (const problem of problems) {
        console.log(`  FAIL ${name}: ${problem}`);
    }
}
if (!rows.every(({ result }) => result.crossOriginIsolated)) {
    console.log('  note: the page was not cross origin isolated, so timers are coarse');
}
for (const line of new Set(logs)) {
    console.log('  | ' + line.slice(0, 200));
}
process.exit(failed ? 1 : 0);
