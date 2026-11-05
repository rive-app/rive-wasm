// Fetches fixed URLs on init and logs each outcome, for
// test/scripting/scriptFetch.test.ts, which stubs the page's fetch().
// Rebake fetch.riv with:
//   RIVE_BAKE_DIR=packages/runtime_wasm/js/test/scripting/fixture \
//       packages/runtime/tests/web_scripting/fixture/bake.sh fetch
import { Layout, Context } from "rive/host";
import { fetch, Response } from "rive/net";

function probe(name: string, url: string): void {
    fetch(url).andThen((response: Response): void => {
        response.text().andThen((body: string): void => {
            console.log(
                "fetch " + name + ": " + response.status.toString() + " " +
                response.statusText + " " + body,
            );
        });
    }, (error: string): void => {
        console.log("fetch " + name + " failed: " + error);
    });
}

export class Main extends Layout {
    override init(context: Context): bool {
        probe("ok", "https://api.example.com/ok");
        probe("network", "https://api.example.com/network");
        probe("large", "https://api.example.com/large");
        probe("insecure", "http://api.example.com/insecure");
        probe("other", "https://other.example.org/other");
        probe("redirect", "https://api.example.com/redirect");
        probe("hang", "https://api.example.com/hang");
        return true;
    }
}
