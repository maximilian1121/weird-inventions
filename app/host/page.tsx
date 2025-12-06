"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { QR } from "react-qr-rounded";
import { emojiCache } from "../emojiCache";
import { popup } from "../alert";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import {
    MoveDirection,
    OutMode,
    type Container,
    type ISourceOptions,
} from "@tsparticles/engine";
import { loadFull } from "tsparticles";

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

type Player = {
    id: string;
    username: string;
};

interface PlayerData {
    username: string;
    prompt: string;
    drawing_data: string;
}

interface PlayerStat {
    username: string;
    score: number;
}

type PlayerDataMap = Record<string, PlayerData>;

type Emoji = {
    src: string;
    x: number;
    y: number;
    yVelocity: number;
    xVelocity: number;
    player_id: string;
};

const GameState = Object.freeze({
    WAITING_FOR_SERVER: "waiting_for_server",
    WAITING: "waiting",
    GET_READY: "get_ready",
    WRITING: "writing",
    FINISHED_WRITING: "finished_writing",
    VIEWING: "viewing",
    DRAWING: "drawing",
    PRESENTING: "presenting",
    END: "end",
    DISCONNECTED: "disconnected",
    ALL_LEFT: "all_left",
});

export default function Play() {
    // #region states/refs
    const [gameState, setGameState] = useState<
        (typeof GameState)[keyof typeof GameState]
    >(GameState.WAITING_FOR_SERVER);
    const gameStateRef = useRef(gameState);
    const [room_code, setRoomCode] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerData, setPlayerData] = useState<PlayerDataMap>({});
    let [emojis, setEmojis] = useState<Emoji[]>([]);
    const [errorText, setErrorText] = useState("");
    const [refreshText, setRefreshText] = useState("refresh");
    const [readingTimeLeft, setReadingTimeLeft] = useState<string>(
        process.env.NEXT_PUBLIC_READING_TIME ?? "20"
    );
    const [drawingTimeLeft, setDrawingTimeLeft] = useState<string>(
        process.env.NEXT_PUBLIC_DRAWING_TIME ?? "120"
    );
    const [presentingTimeLeft, setPresentingTimeLeft] = useState<string>("");
    const [presentingPrompt, setPresentingPrompt] = useState<string>("");
    const [presentingUsername, setPresentingUsername] = useState<string>("");
    const [playerStats, setPlayerStats] = useState<any>();
    const [getReadyMessage, setGetReadyMessage] = useState(
        "Don't forget to have fun!"
    );
    const [init, setInit] = useState(false);

    const reactionCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const presentImgRef = useRef<HTMLImageElement | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const timerClickRef = useRef<HTMLAudioElement>(null);

    // #endregion

    const idToUsernameMap = useMemo(() => {
        const map = new Map<string, string>();
        players.forEach((player) => {
            map.set(player.id, player.username);
        });
        console.log(map.keys());
        return map;
    }, [players]);

    const sendEmoji = (data: any) => {
        setEmojis((prev) => [
            ...prev,
            {
                src: data.emoji,
                x: randomInt(0, 100) / 100,
                y: 1,
                yVelocity: randomInt(3, 7) / 1000,
                xVelocity: randomInt(-7, 7) / 10000,
                player_id: data.player_id,
            },
        ]);
    };

    useEffect(() => {
        function onFullscreenChange() {
            setIsFullscreen(Boolean(document.fullscreenElement));
        }

        document.addEventListener("fullscreenchange", onFullscreenChange);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                onFullscreenChange
            );
        };
    }, []);

    const options: ISourceOptions = useMemo(
        () => ({
            fullScreen: {
                zIndex: -1,
            },
            emitters: [
                {
                    position: {
                        x: 0,
                        y: 100,
                    },
                    rate: {
                        quantity: 15,
                        delay: 0.2,
                    },
                    particles: {
                        move: {
                            direction: "top-right",
                            outModes: {
                                top: "none",
                                right: "none",
                                default: "destroy",
                            },
                        },
                    },
                },
                {
                    position: {
                        x: 100,
                        y: 100,
                    },
                    rate: {
                        quantity: 15,
                        delay: 0.2,
                    },
                    particles: {
                        move: {
                            direction: "top-left",
                            outModes: {
                                top: "none",
                                right: "none",
                                default: "destroy",
                            },
                        },
                    },
                },
            ],
            particles: {
                color: {
                    value: [
                        "#FFFFFF",
                        "#FFd700",
                        "#00FFFC",
                        "#FC00FF",
                        "#1E00FF",
                        "#FF0061",
                        "#E1FF00",
                        "#00FF9E",
                        "#fffc00",
                    ],
                },
                move: {
                    decay: 0.01,
                    direction: "top",
                    enable: true,
                    gravity: {
                        enable: true,
                    },
                    outModes: {
                        top: "none",
                        default: "destroy",
                    },
                    speed: {
                        min: 30,
                        max: 60,
                    },
                },
                number: {
                    value: 0,
                },
                opacity: {
                    value: 1,
                },
                rotate: {
                    value: {
                        min: 0,
                        max: 360,
                    },
                    direction: "random",
                    animation: {
                        enable: true,
                        speed: 30,
                    },
                },
                tilt: {
                    direction: "random",
                    enable: true,
                    value: {
                        min: 0,
                        max: 360,
                    },
                    animation: {
                        enable: true,
                        speed: 30,
                    },
                },
                size: {
                    value: {
                        min: 2,
                        max: 5,
                    },
                    animation: {
                        enable: true,
                        startValue: "min",
                        count: 1,
                        speed: 16,
                        sync: true,
                    },
                },
                roll: {
                    darken: {
                        enable: true,
                        value: 25,
                    },
                    enable: true,
                    speed: {
                        min: 5,
                        max: 15,
                    },
                },
                wobble: {
                    distance: 30,
                    enable: true,
                    speed: {
                        min: -7,
                        max: 7,
                    },
                },
                shape: {
                    type: ["circle", "square", "triangle", "polygon"],
                    options: {
                        polygon: [
                            {
                                sides: 5,
                            },
                            {
                                sides: 6,
                            },
                            {
                                sides: 7,
                            },
                            {
                                sides: 8,
                            },
                            {
                                sides: 9,
                            },
                            {
                                sides: 10,
                            },
                            {
                                sides: 11,
                            },
                            {
                                sides: 12,
                            },
                        ],
                    },
                },
            },
        }),
        []
    );

    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const [currentImageURL, setCurrentImageURL] = useState<string | null>(null);

    useEffect(() => {
        if (presentImgRef.current && currentImageURL) {
            presentImgRef.current.src = currentImageURL;
        }
    }, [currentImageURL]);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadFull(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container) => {
        console.log(container);
    };

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_SERVER);
        const socket = socketRef.current;

        //#region connection stuff
        socket.on("connect", () => {
            const player_id = Cookies.get("host_id");
            socket.emit("assign_id", player_id ?? null);
        });

        socket.on("players_update", (player_list) => {
            setPlayers(player_list);
            if (player_list.length < 2) {
                console.log("Less than two players detected!");
                switch (gameStateRef.current) {
                    case GameState.ALL_LEFT:
                    case GameState.DISCONNECTED:
                    case GameState.WAITING:
                    case GameState.WAITING_FOR_SERVER:
                    case GameState.END:
                        break;
                    default:
                        setGameState(GameState.ALL_LEFT);
                        socket.emit(
                            "cancel_game",
                            "There are not enough players!"
                        );
                }
            }
        });

        socket.on("assign_id", (assigned_id) => {
            Cookies.set("host_id", assigned_id);
            socket.emit("create_lobby", {});
        });

        socket.on("lobby_created", (lobby_code) => {
            setRoomCode(lobby_code);
            setGameState(GameState.WAITING);
        });

        socket.on("game_state", (game_state) => {
            setGameState(game_state);
        });

        socket.on("reaction", (data) => {
            for (let count = 0; count <= 2; count++) {
                sendEmoji(data);
            }
        });

        socket.on("disconnected", (reason) => {
            setGameState(GameState.DISCONNECTED);
        });

        socket.on("disconnect", () => {
            setGameState(GameState.DISCONNECTED);
            setErrorText("Disconnected from game server");
            setRefreshText("Reload page");
            socket.disconnect();
        });
        //#endregion

        socket.on("error", (message) => {
            popup(message, "Error");
        });

        socket.on("finish_writing", (ammountWritten) => {
            setGameState(GameState.FINISHED_WRITING);
            setTimeout(() => {
                socket.emit("hand_out_prompts");
            }, 1000);
        });

        socket.on("start_viewing", async () => {
            setGameState(GameState.VIEWING);
            for (
                let count = Number.parseInt(readingTimeLeft);
                count >= 0;
                count--
            ) {
                setReadingTimeLeft(count.toString() + " seconds left...");
                if (count <= 10) {
                    timerClickRef.current?.play();
                }
                await sleep(1000);
            }
            setReadingTimeLeft("Times up!");
            await sleep(1000);
            setGetReadyMessage("Drawing is going to start!");
            setGameState(GameState.GET_READY);
            await sleep(1000);
            socket.emit("start_drawing");
        });

        socket.on("drawing_started", async (game_state) => {
            console.log("start_drawing");
            setGameState(GameState.DRAWING);
            for (
                let count = Number.parseInt(drawingTimeLeft);
                count >= 0;
                count--
            ) {
                setDrawingTimeLeft(count.toString() + " seconds left...");
                if (count <= 10) {
                    timerClickRef.current?.play();
                }
                await sleep(1000);
            }
            setDrawingTimeLeft("Times up!");
            socket.emit("end_drawing");
            await sleep(1000);
            setGetReadyMessage("Presentations are starting!");
            setGameState(GameState.GET_READY);
            await sleep(1000);
            socket.emit("start_presenting");
        });

        socket.on("player_data", (data: PlayerDataMap) => {
            setGameState(GameState.PRESENTING);
            setPlayerData(data);

            const entries = Object.entries(data);
            let index = 0;

            async function presentNext() {
                if (index >= entries.length) {
                    socket.emit("done_presenting");
                    return;
                }

                const [id, player] = entries[index];
                index++;

                const byteArray = Uint8Array.from(
                    atob(player.drawing_data),
                    (c) => c.charCodeAt(0)
                );
                const blob = new Blob([byteArray], {
                    type: process.env.NEXT_PUBLIC_IMAGE_ENCODING,
                });
                const url = URL.createObjectURL(blob);

                setCurrentImageURL(url);
                setPresentingPrompt(player.prompt);
                setPresentingUsername(player.username);

                socket.emit("set_presenter", { id, username: player.username });

                let time = Number.parseInt(
                    process.env.NEXT_PUBLIC_PRESENTING_TIME ?? "45"
                );

                const countdown = async () => {
                    for (let count = time; count >= 0; count--) {
                        setPresentingTimeLeft(`${count} seconds left...`);
                        if (count <= 10) timerClickRef.current?.play();
                        await sleep(1000);
                    }
                };

                await countdown();
                presentNext();
            }

            presentNext();
        });

        socket.on("game_end", (data) => {
            setPlayerStats(data);
            setGameState(GameState.END);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const cleanup = () => {
        emojis = emojis.filter((emoji) => emoji.y > -0.2);
    };

    function fillTextEllipsis(
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number
    ) {
        let width = ctx.measureText(text).width;
        if (width <= maxWidth) {
            ctx.fillText(text, x, y);
            return;
        }

        let ellipsis = "…";
        let len = text.length;

        while (len > 0) {
            text = text.slice(0, len) + ellipsis;
            width = ctx.measureText(text).width;
            if (width <= maxWidth) break;
            len--;
        }

        ctx.fillText(text, x, y);
    }

    const renderCanvas = () => {
        const canvas = reactionCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (canvas.width !== window.innerWidth)
            canvas.width = window.innerWidth;
        if (canvas.height !== window.innerHeight)
            canvas.height = window.innerHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        const fontFamily = getComputedStyle(document.body)
            .getPropertyValue("--font-geist-sans")
            .trim();

        ctx.font = `16px ${fontFamily}`;

        emojis.forEach((emoji) => {
            emoji.y -= emoji.yVelocity;
            emoji.x -= emoji.xVelocity;

            const img = emojiCache[emoji.src];

            if (img && img.complete) {
                ctx.drawImage(
                    img,
                    canvas.width * emoji.x,
                    canvas.height * emoji.y,
                    80,
                    80
                );
                fillTextEllipsis(
                    ctx,
                    idToUsernameMap.get(emoji.player_id ?? "2") ?? "1",
                    canvas.width * emoji.x,
                    canvas.height * emoji.y + 100,
                    80
                );
            }
        });
    };

    useEffect(() => {
        let animationFrameId: number;

        const loop = () => {
            renderCanvas();
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        const cleanUp = setInterval(cleanup, 250);

        const handleResize = () => renderCanvas();
        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(cleanUp);
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, [emojis]);

    const startGame = () => {
        const socket = socketRef.current;
        if (players.length < 2) {
            popup("Please wait for more players!", "Error");
        } else if (socket) {
            setGetReadyMessage("Let your imagination run wild");
            setGameState(GameState.GET_READY);
            setTimeout(() => {
                socket.emit("start_game", "now");
            }, 2000);
        }
    };

    function fallbackCopyTextToClipboard(text: string) {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = text;

        temporaryInput.style.position = "absolute";
        temporaryInput.style.left = "-9999px";
        document.body.appendChild(temporaryInput);

        temporaryInput.select();
        temporaryInput.setSelectionRange(0, 99999);

        try {
            document.execCommand("copy");
            console.log("Fallback: Text copied to clipboard");
        } catch (err) {
            console.error("Fallback: Failed to copy text: ", err);
        } finally {
            document.body.removeChild(temporaryInput);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-800 font-sans p-6">
            <canvas
                ref={reactionCanvasRef}
                className="w-screen h-screen fixed top-0 left-0"
            />
            <audio ref={timerClickRef} src={"/timer_click.wav"} />
            <main className="max-w-4xl text-center space-y-8 z-1">
                {!isFullscreen && (
                    <div className="relative">
                        <button
                            onClick={() => {
                                document.body.requestFullscreen();
                            }}
                            className="fixed top-4 right-4 cursor-pointer p-2 bg-zinc-200 rounded-lg border-2 border-zinc-300 shadow-2xl hover:scale-[1.1] transition flex items-center gap-2"
                        >
                            <Image
                                src="/fullscreen.png"
                                alt=""
                                width={32}
                                height={32}
                                quality={100}
                                className="rendering-pixelated"
                            />
                            <span className="ml-2">Fullscreen</span>
                        </button>
                    </div>
                )}

                {gameState == GameState.DISCONNECTED ? (
                    <div className="flex flex-col justify-center gap-2 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Disconnected from game
                        </h1>
                        <p className="text-zinc-700 text-xl">{errorText}</p>
                        <button
                            onClick={() => {
                                window.location.reload();
                            }}
                            className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 max-w-64 w-64  rounded-lg cursor-pointer"
                        >
                            {refreshText}
                        </button>
                    </div>
                ) : null}
                {gameState == GameState.ALL_LEFT ? (
                    <div className="flex flex-col justify-center gap-2 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Game ended
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            All players have left/disconnected!
                        </p>
                        <button
                            onClick={() => {
                                window.location.reload();
                            }}
                            className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 max-w-64 w-64  rounded-lg cursor-pointer"
                        >
                            Create a new lobby
                        </button>
                    </div>
                ) : null}
                {gameState === GameState.WAITING_FOR_SERVER ? (
                    <h1 className="text-4xl font-bold tracking-tight">
                        Please wait for the server to send the room code
                    </h1>
                ) : null}
                {gameState === GameState.WAITING && room_code ? (
                    <>
                        <h1 className="text-4xl font-bold tracking-tight flex gap-8 items-center bg-zinc-200 p-4 rounded-lg shadow-xl">
                            <div className="flex flex-col gap-2 text-left">
                                <h1>Lobby code: {room_code}</h1>
                                <p className="text-xl font-normal tracking-normal text-zinc-700">
                                    Join at {`${window.location.origin}/play`}
                                </p>
                                <div className="flex gap-2 font-normal text-xl tracking-normal text-zinc-700">
                                    {[
                                        {
                                            title: "Share",
                                            icon: "/share.png",
                                            action: async () => {
                                                try {
                                                    await navigator.clipboard.writeText(
                                                        `${window.location.origin}/play?lobby_code=${room_code}`
                                                    );
                                                    popup(
                                                        "Copied to clipboard!",
                                                        "Success"
                                                    );
                                                } catch {
                                                    fallbackCopyTextToClipboard(
                                                        `${window.location.origin}/play?lobby_code=${room_code}`
                                                    );
                                                    popup(
                                                        "Copied to clipboard!",
                                                        "Success"
                                                    );
                                                }
                                            },
                                        },
                                        {
                                            title: "Play",
                                            icon: "/play.png",
                                            action: startGame,
                                        },
                                    ].map((btn) => (
                                        <button
                                            key={btn.title}
                                            onClick={btn.action}
                                            title={btn.title}
                                            className="cursor-pointer p-2 bg-zinc-200 rounded-lg border-2 border-zinc-300 shadow-2xl hover:scale-[1.1] transition flex items-center gap-2"
                                        >
                                            <Image
                                                src={btn.icon}
                                                alt={`${btn.title} button`}
                                                width={48}
                                                height={48}
                                                quality={100}
                                                className="rendering-pixelated w-full h-full aspect-square"
                                            />
                                            {btn.title}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-sm font-normal tracking-normal text-zinc-700">
                                    There are {players.length} players
                                    {players.length < 2
                                        ? ", wait for at least two to start!"
                                        : ", start when ready!"}
                                </p>
                            </div>
                            <QR
                                rounding={100}
                                errorCorrectionLevel="M"
                                cutout
                                cutoutElement={
                                    <Image
                                        src="/favicon.ico"
                                        width={128}
                                        height={128}
                                        className="object-contain shadow-xl w-full h-full rendering-pixelated select-none rounded-[100] border-8 border-black"
                                        draggable={false}
                                        alt=""
                                    />
                                }
                                className="h-40 w-40 bg-zinc-300 p-2 rounded-lg aspect-square"
                            >
                                {`${window.location.origin}/play?lobby_code=${room_code}`}
                            </QR>
                        </h1>

                        <div className="flex flex-wrap justify-center items-center gap-4">
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    title={player.id}
                                    className="p-3 rounded-lg bg-zinc-200 shadow w-fit hover:scale-[1.1] transition select-none"
                                >
                                    <p className="font-bold">
                                        {player.username}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}
                {gameState == GameState.GET_READY ? (
                    <div className="flex flex-col justify-center gap-2 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Get ready!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            {getReadyMessage}
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.WRITING ? (
                    <div className="flex flex-col justify-center gap-2 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Write your problems!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Once everyone has finished you will get one
                            another's problems and you will need to read them.
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.FINISHED_WRITING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            All done with writing!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            Shuffling problems amongst you!
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.VIEWING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Read your problems!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            {readingTimeLeft}
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.DRAWING ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Draw the solutions!
                        </h1>
                        <p className="text-zinc-700 text-xl">
                            {drawingTimeLeft}
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.PRESENTING ? (
                    <div className="flex flex-col justify-center gap-1 items-center overflow-visible h-[80vh]">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            {presentingTimeLeft}
                        </h1>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-700">
                            {presentingUsername}'s drawing
                        </h2>

                        <img
                            ref={presentImgRef}
                            className="h-full aspect-video rounded-lg object-contain border-2 border-zinc-300 shadow-lg"
                            alt=""
                        />

                        <p className="text-zinc-700 text-xl">
                            {presentingPrompt}
                        </p>
                    </div>
                ) : null}
                {gameState == GameState.END ? (
                    <div className="flex flex-col justify-center gap-4 items-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                            Game over! Final score:
                        </h1>
                        <div className="h-auto max-h-128 overflow-auto border border-zinc-300 rounded">
                            <table className="text-zinc-700 text-xl w-full">
                                <thead className="sticky top-0 bg-white z-10 text-zinc-800">
                                    <tr>
                                        <th className="p-2 w-32 text-left border-2 border-zinc-300">
                                            Player
                                        </th>
                                        <th className="p-2 w-32 text-left border-2 border-zinc-300">
                                            Score
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white">
                                    {[...playerStats]
                                        .sort((a, b) => b.score - a.score)
                                        .map((p: PlayerStat) => (
                                            <tr
                                                key={
                                                    p.username +
                                                    p.score.toString()
                                                }
                                            >
                                                <td className="p-2 text-left border-2 border-zinc-300">
                                                    {p.username}
                                                </td>
                                                <td className="p-2 text-left border-2 border-zinc-300">
                                                    {p.score}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => {
                                window.location.href = "/host";
                            }}
                            className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 rounded-lg cursor-pointer max-w-64 w-64 "
                        >
                            Play again!
                        </button>

                        <Particles
                            id="tsparticles"
                            particlesLoaded={particlesLoaded}
                            options={options}
                        />
                    </div>
                ) : null}
            </main>
        </div>
    );
}
