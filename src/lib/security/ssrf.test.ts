import { describe, expect, it } from "vitest";
import { isSafePublicUrl } from "./ssrf";

describe("isSafePublicUrl SSRF Protection", () => {
  it("allows valid public URLs", () => {
    expect(isSafePublicUrl("https://example.com").safe).toBe(true);
    expect(isSafePublicUrl("https://github.com/SH20RAJ/campusloop").safe).toBe(true);
    expect(isSafePublicUrl("http://cdn.university.edu:8080/notes.pdf").safe).toBe(true);
    expect(isSafePublicUrl("https://8.8.8.8/dns-query").safe).toBe(true);
    expect(isSafePublicUrl("https://1.1.1.1").safe).toBe(true);
  });

  it("blocks non-HTTP protocols", () => {
    expect(isSafePublicUrl("file:///etc/passwd").safe).toBe(false);
    expect(isSafePublicUrl("ftp://ftp.example.com").safe).toBe(false);
    expect(isSafePublicUrl("gopher://127.0.0.1:70").safe).toBe(false);
    expect(isSafePublicUrl("javascript:alert(1)").safe).toBe(false);
    expect(isSafePublicUrl("data:text/html,<h1>XSS</h1>").safe).toBe(false);
  });

  it("blocks localhost and local hostnames", () => {
    expect(isSafePublicUrl("http://localhost:3000").safe).toBe(false);
    expect(isSafePublicUrl("http://localhost.localdomain").safe).toBe(false);
    expect(isSafePublicUrl("http://dev.localhost").safe).toBe(false);
    expect(isSafePublicUrl("http://intranet.local").safe).toBe(false);
    expect(isSafePublicUrl("http://service.internal").safe).toBe(false);
    expect(isSafePublicUrl("http://nas.lan").safe).toBe(false);
  });

  it("blocks cloud metadata services", () => {
    expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data").safe).toBe(false);
    expect(isSafePublicUrl("http://metadata.google.internal/computeMetadata/v1/").safe).toBe(false);
    expect(isSafePublicUrl("http://metadata.internal").safe).toBe(false);
    expect(isSafePublicUrl("http://instance-data").safe).toBe(false);
  });

  it("blocks IPv4 loopback and private ranges", () => {
    // 127.0.0.0/8 loopback
    expect(isSafePublicUrl("http://127.0.0.1").safe).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.2:8080").safe).toBe(false);
    expect(isSafePublicUrl("http://127.1").safe).toBe(false);

    // 10.0.0.0/8
    expect(isSafePublicUrl("http://10.0.0.1").safe).toBe(false);
    expect(isSafePublicUrl("http://10.255.255.255").safe).toBe(false);

    // 172.16.0.0/12
    expect(isSafePublicUrl("http://172.16.0.1").safe).toBe(false);
    expect(isSafePublicUrl("http://172.31.255.255").safe).toBe(false);

    // 192.168.0.0/16
    expect(isSafePublicUrl("http://192.168.1.1").safe).toBe(false);
    expect(isSafePublicUrl("http://192.168.0.254").safe).toBe(false);

    // 0.0.0.0/8
    expect(isSafePublicUrl("http://0.0.0.0").safe).toBe(false);

    // 100.64.0.0/10 Carrier-grade NAT
    expect(isSafePublicUrl("http://100.64.0.1").safe).toBe(false);
  });

  it("blocks obfuscated IP representations (octal, hex, dword)", () => {
    // 2130706433 is 127.0.0.1 in dword format
    expect(isSafePublicUrl("http://2130706433").safe).toBe(false);
    // 0x7f000001 is 127.0.0.1 in hex format
    expect(isSafePublicUrl("http://0x7f000001").safe).toBe(false);
    // 0x7f.0.0.1
    expect(isSafePublicUrl("http://0x7f.0.0.1").safe).toBe(false);
    // 0177.0.0.1 (octal)
    expect(isSafePublicUrl("http://0177.0.0.1").safe).toBe(false);
  });

  it("blocks IPv6 loopback, link-local, and unique local addresses", () => {
    expect(isSafePublicUrl("http://[::1]").safe).toBe(false);
    expect(isSafePublicUrl("http://[::]").safe).toBe(false);
    expect(isSafePublicUrl("http://[fe80::1]").safe).toBe(false);
    expect(isSafePublicUrl("http://[fc00::1]").safe).toBe(false);
    expect(isSafePublicUrl("http://[fd12:3456:789a::1]").safe).toBe(false);
    expect(isSafePublicUrl("http://[::ffff:127.0.0.1]").safe).toBe(false);
    expect(isSafePublicUrl("http://[::ffff:169.254.169.254]").safe).toBe(false);
  });

  it("blocks dangerous internal ports", () => {
    expect(isSafePublicUrl("http://example.com:22").safe).toBe(false); // SSH
    expect(isSafePublicUrl("http://example.com:25").safe).toBe(false); // SMTP
    expect(isSafePublicUrl("http://example.com:6379").safe).toBe(false); // Redis
    expect(isSafePublicUrl("http://example.com:5432").safe).toBe(false); // Postgres
    expect(isSafePublicUrl("http://example.com:27017").safe).toBe(false); // Mongo
  });
});
