export { DatingNavbar } from "@/components/dating/dating-navbar";
export default function DatingNavbarDefault(props: Parameters<typeof import("@/components/dating/dating-navbar").DatingNavbar>[0]) {
  const { DatingNavbar } = require("@/components/dating/dating-navbar");
  return <DatingNavbar {...props} />;
}
