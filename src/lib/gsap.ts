// ลงทะเบียน plugin ครั้งเดียว — ทุกไฟล์ import gsap/ScrollTrigger/useGSAP จากที่นี่
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
