import { emojiList } from "../emojiCache";
import { Socket } from "socket.io-client";
import { RefObject } from "react";

interface ReactionsProps {
    socketRef: RefObject<Socket | null>;
}

export default function Reactions({ socketRef }: ReactionsProps) {
    return (
        <div className="flex flex-wrap justify-center items-center max-w-2xl gap-2">
            {emojiList.map((emoji, index) => (
                <img
                    key={index}
                    onClick={() => {
                        socketRef.current!.emit("send_reaction", emoji);
                    }}
                    src={emoji}
                    className="text-4xl w-20 h-20 bg-zinc-200 p-2 aspect-square rounded-lg hover:scale-[1.1] transition cursor-pointer select-none rendering-pixelated"
                ></img>
            ))}
        </div>
    );
}
