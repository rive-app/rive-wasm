// Reads one URL a run at a time, one whole as text, one whole as a blob and
// leaves one unread, logging what each gives, for
// test/scripting/scriptFetch.test.ts, which stubs the page's fetch(). Rebake
// stream.riv with:
//   RIVE_BAKE_DIR=packages/runtime_wasm/js/test/scripting/fixture \
//       packages/runtime/tests/web_scripting/fixture/bake.sh stream
import { Layout, Context } from "rive/host";
import { fetch, Response } from "rive/net";

export class Main extends Layout {
    // Kept, so its unread body is not cancelled with it.
    held: Response? = null;

    async runs(): Promise<void> {
        let response = await fetch("https://api.example.com/runs");
        let reader = response.body.getReader();
        let bytes = 0;
        for (;;) {
            let read = await reader.read().settled();
            if (!read.ok) {
                console.log("stream runs failed: " + read.error);
                return;
            }
            if (read.value.done) {
                break;
            }
            bytes += read.value.value!.length;
        }
        console.log("stream runs: " + bytes.toString() + " bytes");
    }

    async whole(): Promise<void> {
        let response = await fetch("https://api.example.com/whole");
        let text = await response.text().settled();
        console.log(text.ok ? "stream whole: " + text.value : "stream whole failed: " + text.error);
    }

    async blob(): Promise<void> {
        let response = await fetch("https://api.example.com/blob");
        let blob = await response.blob().settled();
        console.log(blob.ok
            ? "stream blob: " + blob.value.byteLength.toString() + " bytes"
            : "stream blob failed: " + blob.error);
    }

    async hold(): Promise<void> {
        let response = await fetch("https://api.example.com/hold");
        this.held = response;
        console.log("stream hold: " + response.status.toString());
    }

    override init(context: Context): bool {
        this.runs();
        this.whole();
        this.blob();
        this.hold();
        return true;
    }
}
