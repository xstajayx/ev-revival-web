import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const destination = process.argv[2];
if (!destination) throw new Error("Pass an empty publish directory outside the repository.");
const output = resolve(destination);
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
if (output === root || output.startsWith(root + "/")) throw new Error("Use an output directory outside the repository.");
const name = process.env.JWORLD_OPERATOR_NAME?.trim();
const address = process.env.JWORLD_BUSINESS_ADDRESS?.trim().split(/\r?\n/).map(line => line.trim());
const approved = process.env.JWORLD_PUBLISH_DISCLOSURE === "1";
if (approved && (!name || !address || address.length < 2 ||
    [name, ...address].some(line => !line || line.length > 200 || /[<>\[\]\u0000-\u001f]/.test(line)))) {
  throw new Error("Approved disclosure requires a name and multiline business address.");
}
const escape = value => value.replace(/[&"']/g, char => ({ "&": "&amp;", '"': "&quot;", "'": "&#39;" })[char]);
mkdirSync(output, { recursive: true });
if (readdirSync(output).length) throw new Error("The publish directory must be empty.");
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /^(?:[a-z0-9-]+\.(?:html|js|css|txt|xml|webmanifest)|CNAME)$/.test(entry.name)) {
    cpSync(join(root, entry.name), join(output, entry.name));
  }
}
for (const directory of ['assets', 'data', 'ev-revival-local']) cpSync(join(root, directory), join(output, directory), { recursive: true });
const disclosure = approved
  ? `<p>${escape(name)}, trading as JWorldCreations</p><address>${address.map(escape).join("<br>")}<br>United Kingdom</address>`
  : "";
const page = join(output, "business-information.html");
writeFileSync(page, readFileSync(page, "utf8").replace("<!-- operator-disclosure -->", () => disclosure));
