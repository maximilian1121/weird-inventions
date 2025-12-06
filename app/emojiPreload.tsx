"use client";

import { useEffect } from "react";
import { emojiList, emojiCache } from "./emojiCache";

export default function EmojiPreload() {
    useEffect(() => {
        emojiList.forEach((src) => {
            const img = new Image();
            img.src = src;
            emojiCache[src] = img;
        });
    }, []);

    return null;
}
