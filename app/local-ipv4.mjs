// Local preview shim: this sandbox has no IPv6. Node's default listen host is
// "::" (IPv6 any) whenever no host is given, which fails here with EAFNOSUPPORT.
// Force IPv4 for any TCP listen that would otherwise resolve to IPv6-any.
import net from "node:net";

const origListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  const a0 = args[0];
  if (a0 && typeof a0 === "object" && !("path" in a0) && "port" in a0) {
    if (a0.host === undefined || a0.host === "::") {
      args[0] = { ...a0, host: "0.0.0.0" };
    }
  } else if (typeof a0 === "number" || typeof a0 === "string") {
    // listen(port[, host][, cb]) — insert host when missing, or replace "::"
    if (args[1] === undefined || typeof args[1] === "function") {
      args.splice(1, 0, "0.0.0.0");
    } else if (args[1] === "::") {
      args[1] = "0.0.0.0";
    }
  }
  return origListen.apply(this, args);
};
