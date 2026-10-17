#!/usr/bin/env bash
# แตกเฟรม image sequence จากคลิปใน design/sequences → public/sequences/<name>/0001.webp …
#
# ใช้:  bash scripts/extract-frames.sh <name> [duration_sec] [fps] [quality]
#   bash scripts/extract-frames.sh seq-1-hero            # 0–8.0s, 24fps
#   bash scripts/extract-frames.sh seq-2-anatomy
#   bash scripts/extract-frames.sh seq-3-aquascape 6.4   # หลัง 6.4s พืชยุบผิดธรรมชาติ ห้ามใช้
#
# ครอป: คลิปต้นฉบับ 1280×720 มีลายน้ำ ✦ มุมขวาล่าง (x≈1205–1250) และแถบดำ 4px ที่ขอบบน
#   → เก็บ 93% ของความกว้างจากซ้าย (1190px) และเริ่มที่ y=4 สูง 666px (≈16:9)
#   ไม่ scale ขึ้น — ภาพจึงกว้าง 1190px (ไม่เกิน 1280px ตาม spec)
# งบ: ≤ 80KB/เฟรม และ ≤ 6MB/ชุด — ถ้าเกินให้ลด fps (16–20) หรือ quality

set -euo pipefail

name="${1:?ระบุชื่อคลิป เช่น seq-1-hero}"
duration="${2:-8}"
fps="${3:-24}"
quality="${4:-70}"

root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/design/sequences/$name.mp4"
out="$root/public/sequences/$name"

command -v ffmpeg >/dev/null || { echo "ไม่พบ ffmpeg — ติดตั้งด้วย: winget install --id Gyan.FFmpeg -e" >&2; exit 1; }
[ -f "$src" ] || { echo "ไม่พบไฟล์ $src" >&2; exit 1; }

rm -rf "$out"
mkdir -p "$out"

ffmpeg -v error -i "$src" -t "$duration" -an \
  -vf "fps=$fps,crop=1190:666:0:4" \
  -c:v libwebp -quality "$quality" -compression_level 6 \
  "$out/%04d.webp"

count=$(ls "$out" | wc -l)
total=$(du -sk "$out" | cut -f1)
largest=$(ls -S "$out" | head -1)
largest_kb=$(( $(wc -c < "$out/$largest") / 1024 ))

echo "$name: $count เฟรม · รวม ${total}KB · ใหญ่สุด $largest ${largest_kb}KB"
[ "$total" -le 6144 ] || echo "⚠ เกิน 6MB — ลด fps หรือ quality" >&2
[ "$largest_kb" -le 80 ] || echo "⚠ มีเฟรมเกิน 80KB" >&2
