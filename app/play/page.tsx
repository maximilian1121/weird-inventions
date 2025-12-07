"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import DrawingCanvas from "./drawingCanvas";
import Image from "next/image";
import { popup } from "../alert";
import Reactions from "./reactions";

const GameState = Object.freeze({
    WAITING_FOR_SERVER: "waiting_for_server",
    JOINING: "joining_game",
    WAITING: "waiting",
    WRITING: "writing",
    FINISHED_WRITING: "finished_writing",
    VIEWING: "viewing",
    DRAWING: "drawing",
    FINISHED_DRAWING: "finished_drawing",
    PRESENTING: "presenting",
    CURRENT_PRESENTER: "current_presenter",
    VOTED: "voted",
    END: "end",
    DISCONNECTED: "disconnected",
});

//#region Ai generated example problems...
const exampleProblems = [
    "Toilet flushes like it's shy",
    "Microwave only works when you compliment it",
    "Fridge growls at night",
    "Lights flicker Morse code insults",
    "Shower randomly switches to 'Arctic Blast' mode",
    "Doorbell plays elevator music at 3AM",
    "Vacuum cleaner screams back",
    "Toaster launches bread into low Earth orbit",
    "Wi-Fi only works if you stand on one foot",
    "Thermostat thinks it's July in Antarctica",
    "Blender whispers your secrets",
    "Washing machine spins like it's on a rollercoaster",
    "Oven refuses to preheat unless bribed with cookies",
    "TV remote takes a five-second nap after every button press",
    "Ceiling fan occasionally attempts lift-off",
    "Air conditioner blows 'slightly judgemental' air",
    "Dishwasher jams because it 'doesn't like forks today'",
    "Couch eats your phone on sight",
    "Lamp turns on only when you're not looking",
    "Closet door dramatically slams for attention",
    "Bed squeaks randomly for no reason",
    "Garage door opens itself for 'fresh air'",
    "Coffee maker brews lukewarm disappointment",
    "Printer prints cryptic runes at 2AM",
    "Stove burners take turns deciding not to work",
    "Floorboard honks like a clown nose",
    "Mirror adds an extra pimple you don't have",
    "Curtains close themselves when offended",
    "Window refuses to open because it's 'tired'",
    "Trash can hisses when full",
    "Alarm clock snoozes itself",
    "Carpet randomly becomes sticky like spilled soda never left",
    "Fan oscillates only to look away from you",
    "Refrigerator light flickers like a haunted rave",
    "Freezer freezes things you didn't put in it",
    "Keyboard deletes messages it finds cringe",
    "Mouse double-clicks out of pure spite",
    "Router reboots whenever drama starts in the house",
    "TV only shows channels you hate",
    "Speaker plays faint elevator music when off",
    "Closet smells like wet dog despite zero dogs",
    "Bookshelf rearranges itself alphabetically wrong",
    "Microwave door opens dramatically for attention",
    "Drawer refuses to close because it's 'thinking'",
    "Bath drain gurgles like a dying walrus",
    "Floor vibrates when your upstairs neighbor sneezes",
    "Doorknob shocks you for fun",
    "Fridge ice maker spits out exactly one cube per hour",
    "Ceiling tiles occasionally fall slowly to scare you",
    "Pillows switch sides when you aren't looking",
];
//#endregion

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

const colors: Record<number, string> = {
    1: "bg-red-200",
    2: "bg-orange-200",
    3: "bg-yellow-200",
    4: "bg-green-200",
    5: "bg-blue-200",
};

function useIsLandscape() {
    const [isLandscape, setIsLandscape] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const checkOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        checkOrientation();
        window.addEventListener("resize", checkOrientation);
        window.addEventListener("orientationchange", checkOrientation);

        return () => {
            window.removeEventListener("resize", checkOrientation);
            window.removeEventListener("orientationchange", checkOrientation);
        };
    }, []);

    return isLandscape;
}

export default function Play() {
    const [gameState, setGameState] = useState<
        (typeof GameState)[keyof typeof GameState]
    >(GameState.WAITING_FOR_SERVER);
    const [lobbyCode, setLobbyCode] = useState(0);
    const [errorText, setErrorText] = useState("");
    const [refreshText, setRefreshText] = useState("refresh");
    const [prompt, setPrompt] = useState("");

    const [presenterUsername, setPresenterUsername] = useState("");
    const [presenterId, setPresenterId] = useState("");

    const [isConnected, setIsConnected] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const drawingCanvasRef = useRef<any>(null);

    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_SERVER);
        const socket = socketRef.current;

        //#region connection stuff
        socket.on("connect", () => {
            const player_id = Cookies.get("player_id");
            socket.emit("assign_id", player_id ?? null);
            setGameState(GameState.JOINING);
            setIsConnected(true);
        });

        socket.on("assign_id", (assigned_id) => {
            Cookies.set("player_id", assigned_id);
        });

        socket.on("game_state", (game_state) => {
            setGameState(game_state);
        });

        socket.on("joined_lobby", (lobby_code) => {
            setGameState(GameState.WAITING);
            setLobbyCode(lobby_code);
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
                navigator.userAgent
            );
            if (isMobile) {
                document.body.requestFullscreen().catch(() => {
                    console.log("Fullscreen blocked on mobile");
                });
            }
        });

        socket.on("cancel_game", (lobby_code) => {
            window.location.reload();
        });

        socket.on("disconnected", (reason) => {
            setIsConnected(false);
            setGameState(GameState.DISCONNECTED);
            setErrorText(reason);
            setRefreshText("Connect to new lobby");
        });

        socket.on("disconnect", () => {
            setGameState(GameState.DISCONNECTED);
            setErrorText(
                "Disconnected from game server... Don't reload yet! The game is actively trying to reconnect give us a minute!"
            );
            setRefreshText("Reload page");
        });
        //#endregion

        socket.on("writing_submitted", () => {
            setGameState(GameState.FINISHED_WRITING);
        });

        socket.on("give_prompt", (prompt) => {
            setPrompt(prompt);
            setGameState(GameState.VIEWING);
        });

        socket.on("end_drawing", () => {
            setGameState(GameState.FINISHED_DRAWING);
            const drawingCanvasReference = drawingCanvasRef.current;
            if (drawingCanvasReference == null) {
                return;
            }
            const canvas = drawingCanvasReference.getCanvas();
            if (canvas == null) {
                return;
            }
            canvas.toBlob(
                (blob: any) => {
                    if (!blob) return;

                    const reader = new FileReader();
                    reader.onload = () => {
                        const arrayBuffer = reader.result;
                        socket.emit("submit_drawing", arrayBuffer, {
                            type: blob.type,
                        });
                    };
                    reader.readAsArrayBuffer(blob);
                },
                process.env.NEXT_PUBLIC_IMAGE_ENCODING,
                Number.parseFloat(
                    process.env.NEXT_PUBLIC_IMAGE_QUALITY ?? "0.8"
                )
            );
        });

        socket.on("you_are_presenting", (data) => {
            setGameState(GameState.CURRENT_PRESENTER);
        });

        socket.on("voted", (data) => {
            setGameState(GameState.VOTED);
        });

        socket.on("current_presenter", (data) => {
            setGameState(GameState.PRESENTING);
            setPresenterUsername(data.username);
            setPresenterId(data.id);
        });

        socket.on("error", (message) => {
            popup(message, "Error");
        });

        const reConnectInterval = setInterval(() => {
            if (socket.disconnected) {
                socket.connect();
            }
        }, 250);

        return () => {
            clearInterval(reConnectInterval);
            socket.disconnect();
        };
    }, []);

    const codeInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);

    const sendJoinGame = (lobby_code: any, username: any) => {
        if (username && lobby_code) {
            if (username.trim().length > 0) {
                console.log(socketRef);
                if (socketRef.current) {
                    socketRef.current.emit("join_lobby", {
                        lobby_code: Number.parseInt(lobby_code),
                        username: username,
                    });
                }
            } else {
                popup("Please enter a username!", "Error");
            }
        } else {
            popup("Please enter all lobby details!", "Error");
        }
    };

    const writingInputRef = useRef<HTMLTextAreaElement>(null);

    const submitWriting = () => {
        const value = writingInputRef.current?.value;
        if (value && value.trim().length > 0) {
            socketRef.current?.emit("submit_prompt", {
                prompt: value,
            });
        }
    };

    function auto_grow(element: any) {
        element.style.height = "1px";
        element.style.height = element.scrollHeight + "px";
    }

    useEffect(() => {
        if (gameState === GameState.JOINING && codeInputRef.current) {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("lobby_code");
            if (code) {
                codeInputRef.current.value = code;
            }
        }
        if (gameState === GameState.END) {
            window.location.href = "/end";
        }
    }, [gameState]);

    return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 text-zinc-900 font-sans p-6">
            <main className="max-w-4xl text-center space-y-8">
                {!useIsLandscape() &&
                    !(
                        gameState === GameState.DISCONNECTED ||
                        gameState === GameState.WAITING_FOR_SERVER ||
                        gameState === GameState.JOINING
                    ) && (
                        <div className="fixed top-0 left-0 w-full h-full z-9999 bg-white flex flex-col items-center justify-center p-6">
                            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 text-center">
                                Please use landscape mode!
                            </h1>
                            <Image
                                src={"/rotate_phone.png"}
                                quality={100}
                                width={256}
                                height={256}
                                className="rendering-pixelated"
                                alt=""
                            />
                            <p className="text-zinc-700 text-xl text-center mt-4">
                                It makes the game playable! You do not want to
                                see what it looks like without it...
                            </p>
                        </div>
                    )}

                {gameState === GameState.DISCONNECTED ? (
                    <div className="flex flex-col justify-center gap-2 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Disconnected from game
                        </h1>
                        <p className="text-zinc-700 text-xl">{errorText}</p>
                        <button
                            onClick={() => {
                                window.location.href = "/play";
                            }}
                            className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 rounded-lg cursor-pointer max-w-64 w-64 "
                        >
                            {refreshText}
                        </button>
                    </div>
                ) : null}
                {gameState === GameState.WAITING_FOR_SERVER ? (
                    <div className="flex flex-col justify-center items-center gap-2">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Connecting to game server
                        </h1>
                        <p className="text-zinc-700 text-xl">Please wait...</p>
                    </div>
                ) : null}
                {gameState === GameState.JOINING ? (
                    <div className="flex flex-col justify-center items-center align-middle overflow-show gap-4">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Join game
                        </h1>
                        <label
                            id="lobby-code-label"
                            className="text-zinc-700 text-xl"
                        >
                            Lobby Code
                        </label>
                        <input
                            aria-labelledby="lobby-code-label"
                            className="text-xl w-64 bg-zinc-200 rounded-lg shadow-md text-center p-2 text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            type="number"
                            required
                            min={1000}
                            max={999999}
                            id="lobby-input"
                            ref={codeInputRef}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    usernameInputRef.current?.focus();
                                }
                            }}
                        />

                        <label
                            id="username-label"
                            className="text-zinc-700 text-xl"
                        >
                            Username
                        </label>
                        <input
                            aria-labelledby="username-label"
                            className="text-xl w-64 bg-zinc-200 rounded-lg shadow-md text-center p-2 text-zinc-700"
                            type="text"
                            maxLength={24}
                            id="username-input"
                            minLength={1}
                            required
                            ref={usernameInputRef}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (!isConnected) {
                                        popup(
                                            "Connecting to server... please wait a second.",
                                            "Info"
                                        );
                                        return;
                                    } else {
                                        sendJoinGame(
                                            codeInputRef.current?.value,
                                            usernameInputRef.current?.value
                                        );
                                    }
                                }
                            }}
                        />

                        <button
                            onClick={() => {
                                if (!isConnected) {
                                    popup(
                                        "Connecting to server... please wait a second.",
                                        "Info"
                                    );
                                    return;
                                } else {
                                    sendJoinGame(
                                        codeInputRef.current?.value,
                                        usernameInputRef.current?.value
                                    );
                                }
                            }}
                            className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 rounded-lg cursor-pointer max-w-64 w-64 "
                        >
                            Join
                        </button>
                    </div>
                ) : null}
                {gameState === GameState.WAITING ? (
                    <div className="flex flex-col gap-2 justify-center items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            In lobby: {lobbyCode}
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Please wait for the host to start the game!
                        </p>
                        <Reactions socketRef={socketRef} />
                    </div>
                ) : null}
                {gameState === GameState.WRITING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Write your problem!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Make it unique, un-realistic, funny, cringe. Let
                            your imagination run wild.
                        </p>
                        <textarea
                            className="text-xl w-2xl bg-zinc-200 rounded-lg shadow-md text-center p-2 text-zinc-700 resize-none"
                            placeholder={
                                exampleProblems[
                                    randomInt(0, exampleProblems.length - 1)
                                ] + " AI GENERATED"
                            }
                            ref={writingInputRef}
                            onInput={(e) => {
                                auto_grow(e.target);
                            }}
                            rows={1}
                        />
                        <button
                            onClick={() => {
                                submitWriting();
                            }}
                            className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 rounded-lg cursor-pointer max-w-64 w-64 "
                        >
                            Submit
                        </button>
                    </div>
                ) : null}
                {gameState == GameState.FINISHED_WRITING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Problem submitted!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Wait for other players to finish writing!
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.VIEWING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Read your problem!
                        </h1>
                        <p className="text-zinc-700 text-xl">{prompt}</p>
                    </div>
                ) : null}
                {gameState == GameState.DRAWING ? (
                    <div className="flex w-full h-full flex-col justify-center gap-4 items-center overflow-visible">
                        <DrawingCanvas ref={drawingCanvasRef} />
                    </div>
                ) : null}
                {gameState == GameState.FINISHED_DRAWING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Presentations are about to start!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Get ready to present your masterpiece
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.CURRENT_PRESENTER ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            You are presenting!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Explain your solution and why it works. Good luck!
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.PRESENTING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            {presenterUsername} is presenting!
                        </h1>
                        <div className="p-2 flex gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        if (socketRef.current) {
                                            socketRef.current.emit(
                                                "vote_presentation",
                                                {
                                                    id: presenterId,
                                                    score: num,
                                                }
                                            );
                                        }
                                    }}
                                    className={`${colors[num]} w-12 h-12 rounded-lg text-zinc-700 hover:scale-[1.1] cursor-pointer transition
        flex items-center justify-center`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <Reactions socketRef={socketRef} />
                    </div>
                ) : null}
                {gameState == GameState.VOTED ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Vote submitted!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Your vote has been submitted to the game server.
                        </p>
                        <Reactions socketRef={socketRef} />
                    </div>
                ) : null}
            </main>
        </div>
    );
}
