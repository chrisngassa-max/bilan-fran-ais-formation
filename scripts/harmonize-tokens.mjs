import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

const REPLACEMENTS = [
  ["bg-[#fcfaf7]", "bg-surface-app"],
  ["bg-[#2c1d1a]", "bg-sidebar-bg"],
  ["border-[#3e2e2a]", "border-sidebar-border"],
  ["hover:bg-[#3e2e2a]", "hover:bg-sidebar-border"],
  ["bg-[#3e2e2a]", "bg-sidebar-border"],
  ["bg-[#fffbf9]", "bg-surface-container-lowest"],
  ["from-[#56423c] to-[#2c1d1a]", "from-on-surface-variant to-sidebar-bg"],
  ["from-[#2c1d1a] to-[#56423c]", "from-sidebar-bg to-on-surface-variant"],
  ["text-[#9d4222]", "text-primary"],
  ["bg-[#9d4222]/10", "bg-primary/10"],
  ["border-[#9d4222]/20", "border-primary/20"],
  ["border-[#9d4222]", "border-primary"],
  ["bg-[#9d4222]", "bg-primary"],
  ["text-[#2c1d1a]", "text-sidebar-bg"],
  ["bg-[#25D366] hover:bg-[#20ba56]", "bg-whatsapp hover:bg-whatsapp-hover"],
  ["bg-[#f8efec]", "bg-accent-warm"],
  ["text-[#7e2c0d]", "text-amber-deep"],
  ["bg-[#56423c]/5 border border-[#56423c]/10 text-xs text-[#56423c]", "bg-on-surface-variant/5 border border-on-surface-variant/10 text-xs text-on-surface-variant"],
  ["text-slate-600", "text-on-surface-variant"],
  ["text-slate-500", "text-outline"],
  ["text-slate-900", "text-on-surface"],
  ["text-slate-800", "text-on-surface"],
  ["text-slate-700", "text-on-surface-variant"],
  ["bg-slate-50", "bg-surface-container-low"],
  ["bg-slate-100", "bg-surface-container"],
  ["border-slate-200", "border-outline-variant"],
  ["border-slate-100", "border-outline-variant/50"],
  ["text-gray-900", "text-on-surface"],
  ["text-gray-800", "text-on-surface"],
  ["text-gray-700", "text-on-surface-variant"],
  ["text-gray-600", "text-on-surface-variant"],
  ["text-gray-500", "text-outline"],
  ["text-gray-400", "text-outline"],
  ["bg-gray-50", "bg-surface-container-low"],
  ["bg-gray-100", "bg-surface-container"],
  ["hover:bg-gray-50", "hover:bg-surface-container-low"],
  ["hover:bg-gray-200", "hover:bg-surface-container-high"],
  ["border-gray-300", "border-outline-variant"],
  ["border-gray-200", "border-outline-variant"],
  ["border-gray-100", "border-outline-variant/50"],
  ["prose prose-sm max-w-none text-gray-800", "prose prose-sm max-w-none text-on-surface"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!name.includes("node_modules")) walk(p, files);
    } else if ([".tsx", ".ts", ".css"].includes(extname(p))) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let content = readFileSync(file, "utf8");
  let orig = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== orig) {
    writeFileSync(file, content);
    changed++;
    console.log("updated:", file.replace(ROOT, ""));
  }
}
console.log(`Done. ${changed} files updated.`);
