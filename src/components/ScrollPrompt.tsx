import { ChevronDown } from "lucide-react";

export default function ScrollPrompt({ text, href }: { text: string; href: string }) {
  return (
    <a className="scroll-prompt" href={href}>
      <span>{text}</span>
      <ChevronDown className="scroll-prompt__icon" size={20} strokeWidth={1.5} aria-hidden="true" />
    </a>
  );
}
