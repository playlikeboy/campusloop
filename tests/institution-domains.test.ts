import { describe, expect, it } from "bun:test";
import {
  getCandidateParentDomains,
  VERIFIED_STUDENT_EMAIL_DOMAINS,
  findInstitutionByDomain,
  getInstitutionAllowedDomains,
  validateEmailDomainForInstitution,
} from "@/lib/institutions";

describe("College Student Email Formats & Subdomain Resolution", () => {
  describe("getCandidateParentDomains", () => {
    it("extracts parent domains for department and student subdomains", () => {
      expect(getCandidateParentDomains("kgpian.iitkgp.ac.in")).toEqual(["iitkgp.ac.in"]);
      expect(getCandidateParentDomains("smail.iitm.ac.in")).toEqual(["iitm.ac.in"]);
      expect(getCandidateParentDomains("cse.iitb.ac.in")).toEqual(["iitb.ac.in"]);
      expect(getCandidateParentDomains("pilani.bits-pilani.ac.in")).toEqual(["bits-pilani.ac.in"]);
      expect(getCandidateParentDomains("learner.manipal.edu")).toEqual(["manipal.edu"]);
      expect(getCandidateParentDomains("students.iiit.ac.in")).toEqual(["iiit.ac.in"]);
      expect(getCandidateParentDomains("student.nitw.ac.in")).toEqual(["nitw.ac.in"]);
      expect(getCandidateParentDomains("pesu.pes.edu")).toEqual(["pes.edu"]);
    });

    it("handles deeply nested subdomains", () => {
      expect(getCandidateParentDomains("lab.cse.iitkgp.ac.in")).toEqual([
        "cse.iitkgp.ac.in",
        "iitkgp.ac.in",
      ]);
    });

    it("returns empty array for root academic domains and public suffixes", () => {
      expect(getCandidateParentDomains("iitkgp.ac.in")).toEqual([]);
      expect(getCandidateParentDomains("vit.ac.in")).toEqual([]);
      expect(getCandidateParentDomains("manipal.edu")).toEqual([]);
      expect(getCandidateParentDomains("ac.in")).toEqual([]);
      expect(getCandidateParentDomains("")).toEqual([]);
    });
  });

  describe("VERIFIED_STUDENT_EMAIL_DOMAINS registry", () => {
    it("contains verified student email formats for key Indian institutions", () => {
      // IIT Kharagpur
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.iitkgp).toContain("kgpian.iitkgp.ac.in");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.iitkgp).toContain("iitkgp.ac.in");

      // IIT Madras
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.iitm).toContain("smail.iitm.ac.in");

      // VIT
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.vit).toContain("vitstudent.ac.in");

      // Manipal
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.manipal).toContain("learner.manipal.edu");

      // BITS Pilani
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.bitspilani).toContain("pilani.bits-pilani.ac.in");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.bitspilani).toContain("goa.bits-pilani.ac.in");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.bitspilani).toContain("hyderabad.bits-pilani.ac.in");

      // IIIT Hyderabad
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.iiit).toContain("students.iiit.ac.in");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.iiit).toContain("research.iiit.ac.in");

      // Amity & PEC
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.amity).toContain("s.amity.edu");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.pec).toContain("pec.edu.in");

      // NITs
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.nitk).toContain("nitk.edu.in");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.nitw).toContain("student.nitw.ac.in");
      expect(VERIFIED_STUDENT_EMAIL_DOMAINS.vnit).toContain("students.vnit.ac.in");
    });
  });

  describe("validateEmailDomainForInstitution", () => {
    it("validates student emails against college slug", async () => {
      // IIT Kharagpur with @kgpian.iitkgp.ac.in
      const kgpRes = await validateEmailDomainForInstitution("student@kgpian.iitkgp.ac.in", "iitkgp");
      expect(kgpRes.valid).toBe(true);
      expect(kgpRes.collegeName).toContain("Kharagpur");

      // IIT Madras with @smail.iitm.ac.in
      const iitmRes = await validateEmailDomainForInstitution("student@smail.iitm.ac.in", "iitm");
      expect(iitmRes.valid).toBe(true);

      // VIT with @vitstudent.ac.in
      const vitRes = await validateEmailDomainForInstitution("student@vitstudent.ac.in", "vit");
      expect(vitRes.valid).toBe(true);

      // Manipal with @learner.manipal.edu
      const manipalRes = await validateEmailDomainForInstitution("student@learner.manipal.edu", "manipal");
      expect(manipalRes.valid).toBe(true);

      // BITS Pilani with @pilani.bits-pilani.ac.in
      const bitsRes = await validateEmailDomainForInstitution("student@pilani.bits-pilani.ac.in", "bitspilani");
      expect(bitsRes.valid).toBe(true);

      // IIIT Hyderabad with @students.iiit.ac.in
      const iiitRes = await validateEmailDomainForInstitution("student@students.iiit.ac.in", "iiit");
      expect(iiitRes.valid).toBe(true);
    });

    it("rejects mismatched college email domains", async () => {
      // vitstudent.ac.in submitted for IIT Kharagpur
      const res = await validateEmailDomainForInstitution("student@vitstudent.ac.in", "iitkgp");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("is not recognized for");
    });

    it("rejects personal emails even when college is specified", async () => {
      const res = await validateEmailDomainForInstitution("student@gmail.com", "iitkgp");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Personal email");
    });
  });

  describe("findInstitutionByDomain", () => {
    it("resolves student email domains to the correct institution", async () => {
      const kgpInst = await findInstitutionByDomain("kgpian.iitkgp.ac.in");
      expect(kgpInst).not.toBeNull();
      expect(kgpInst?.slug).toBe("iitkgp");

      const vitInst = await findInstitutionByDomain("vitstudent.ac.in");
      expect(vitInst).not.toBeNull();
      expect(vitInst?.slug).toBe("vit");

      const iitmInst = await findInstitutionByDomain("smail.iitm.ac.in");
      expect(iitmInst).not.toBeNull();
      expect(iitmInst?.slug).toBe("iitm");

      const manipalInst = await findInstitutionByDomain("learner.manipal.edu");
      expect(manipalInst).not.toBeNull();
      expect(manipalInst?.slug).toBe("manipal");
    });

    it("resolves nested subdomains via parent domain hierarchy", async () => {
      const deptInst = await findInstitutionByDomain("dept.iitkgp.ac.in");
      expect(deptInst).not.toBeNull();
      expect(deptInst?.slug).toBe("iitkgp");
    });
  });
});
