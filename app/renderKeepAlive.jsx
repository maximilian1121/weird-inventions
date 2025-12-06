"use client";

import { io } from "socket.io-client";
import { useEffect, useState } from "react";

export default function RenderKeepAlive() {
    const [connected, setConnected] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_SERVER);
        socket.on("disconnect", () => setConnected(false));
        socket.on("connect", () => setConnected(true));

        const reconnectInterval = setInterval(() => socket.connect(), 500);
        return () => {
            socket.disconnect();
            clearInterval(reconnectInterval);
        };
    }, []);

    const color = connected ? "green" : "red";
    const text = connected ? "Connected" : "Disconnected";

    return (
        <div className="fixed z-10 bottom-2 right-2">
            <div
                title={text}
                className={`flex items-center justify-center gap-2 rounded-full border border-${color}-300  
                    bg-${color}-50 cursor-pointer h-8 w-8 transition`}
            >
                <div
                    className={` 
                        w-4 h-4 rounded-full bg-${color}-200 transition
                    `}
                />
            </div>
        </div>
    );
}
