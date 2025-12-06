"use client";

import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";

type PopupData = {
    message: string;
    title?: string | null;
    id: number;
    visible: boolean;
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
let popups: PopupData[] = [];
let idCounter = 0;

const render = () => {
    if (!container) return;
    if (!root) root = createRoot(container);

    root.render(
        <div className="fixed top-4 left-4 flex flex-col gap-2 z-50">
            {popups.map((p) => (
                <Popup key={p.id} data={p} />
            ))}
        </div>
    );
};

// single popup component with internal animation
const Popup = ({ data }: { data: PopupData }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // trigger slide-in on mount
        const enter = requestAnimationFrame(() => setVisible(true));

        // start leaving after 3s
        const timeout = setTimeout(() => setVisible(false), 3000);

        // cleanup
        return () => {
            cancelAnimationFrame(enter);
            clearTimeout(timeout);
        };
    }, []);

    // remove from popups after exit animation
    useEffect(() => {
        if (!visible) {
            const timer = setTimeout(() => {
                popups = popups.filter((p) => p.id !== data.id);
                render();
            }, 300); // match transition duration
            return () => clearTimeout(timer);
        }
    }, [visible]);

    return (
        <div
            className={`
                bg-white border border-zinc-300 shadow-xl rounded-lg p-4 min-w-[200px] max-w-xs
                transform transition-all duration-300 ease-out
                ${
                    visible
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-52 opacity-0"
                }
            `}
        >
            {data.title && (
                <div className="font-semibold tracking-tight text-xl text-zinc-800 mb-1">
                    {data.title}
                </div>
            )}
            <div className="text-zinc-700">{data.message}</div>
        </div>
    );
};

export const popup = (message: string, title?: string | null) => {
    if (!container) {
        container = document.createElement("div");
        document.body.appendChild(container);
    }

    const newPopup: PopupData = {
        message,
        title: title ?? null,
        id: idCounter++,
        visible: false,
    };

    popups.push(newPopup);
    render();
};
