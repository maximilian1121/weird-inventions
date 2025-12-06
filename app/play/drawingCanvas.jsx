import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
} from "react";
import { CirclePicker } from "react-color";

const languagesToUseColourWith = [
    "en-CA",
    "en-GB",
    "en-AU",
    "en-NZ",
    "en-IE",
    "en-ZA",
    "en-IN",
    "fr-CA",
];

const Tools = Object.freeze({
    PENCIL: "Pencil",
    ERASER: "Eraser",
});

const DrawingCanvas = forwardRef(({}, ref) => {
    const userLang = navigator.language || "en-US";
    const usesColour = languagesToUseColourWith.includes(userLang);

    const [currentTool, setCurrentTool] = useState(Tools.PENCIL);
    const [currentColour, setCurrentColour] = useState("#607d8b");
    const [toolWidth, setToolWidth] = useState(8);
    const [showColourPicker, setShowColourPicker] = useState(false);

    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const colourPickerRef = useRef(null);
    const swatchRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 4;
        ctxRef.current = ctx;
    }, []);

    const getPointerPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const ctx = ctxRef.current;
        if (!ctx) return;
        const { x, y } = getPointerPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = ctxRef.current;
        if (!ctx) return;

        if (currentTool === Tools.PENCIL) {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = currentColour;
            ctx.lineWidth = toolWidth;
        } else if (currentTool === Tools.ERASER) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = toolWidth * 2;
        }

        const { x, y } = getPointerPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };

    useEffect(() => {
        const handleUp = (e) => {
            stopDrawing();
        };
        window.addEventListener("mouseup", handleUp);
        window.addEventListener("touchend", handleUp);
        return () => {
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchend", handleUp);
        };
    }, []);

    useEffect(() => {
        const handleDown = (e) => {
            if (
                colourPickerRef.current &&
                !colourPickerRef.current.contains(e.target)
            ) {
                setShowColourPicker(false);
            }
        };
        window.addEventListener("mousedown", handleDown);
        return () => {
            window.removeEventListener("mousedown", handleDown);
        };
    });

    const handleChangeComplete = (color) => {
        setCurrentColour(color.hex);
        setShowColourPicker(false);
        setCurrentTool(Tools.PENCIL);
    };

    return (
        <div className="inline-flex justify-center gap-4 w-full h-full items-center text-left relative">
            <div className="flex-col gap-2 flex align-middle">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-800">
                    Tools
                </h1>
                <div className="flex flex-row justify-center gap-2">
                    <button
                        onClick={() => setCurrentTool(Tools.PENCIL)}
                        className="bg-blue-200 p-2 w-full rounded-lg text-zinc-700 hover:scale-[1.1] cursor-pointer transition"
                    >
                        Pencil
                    </button>
                    <button
                        onClick={() => setCurrentTool(Tools.ERASER)}
                        className="bg-red-200 p-2 w-full rounded-lg text-zinc-700 hover:scale-[1.1] cursor-pointer transition"
                    >
                        Eraser
                    </button>
                </div>

                <h1>Selected: {currentTool}</h1>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-800">
                    Tool width
                </h1>
                <div className="items-center flex w-full gap-2">
                    <p className="w-8">
                        {currentTool === Tools.ERASER
                            ? toolWidth * 2
                            : toolWidth}
                    </p>
                    <input
                        type="range"
                        min="4"
                        max="32"
                        step="4"
                        className="w-full"
                        onChange={(e) => setToolWidth(Number(e.target.value))}
                        defaultValue={8}
                    />
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-zinc-800">
                    {usesColour ? "Colour" : "Color"}
                </h1>
                <span
                    ref={swatchRef}
                    style={{ backgroundColor: currentColour }}
                    className="w-full h-16 cursor-pointer border-2 border-zinc-400 rounded-lg relative"
                    onClick={() => setShowColourPicker(true)}
                >
                    {showColourPicker && (
                        <div
                            ref={colourPickerRef}
                            className="absolute flex flex-col gap-2 bottom-0 z-50 bg-zinc-200 p-4 rounded-lg shadow-2xl border-2 border-zinc-300"
                        >
                            <h1 className="text-2xl font-semibold tracking-tight text-zinc-800">
                                {usesColour ? "Colour" : "Color"} picker
                            </h1>
                            <CirclePicker
                                color={currentColour}
                                onChangeComplete={handleChangeComplete}
                            />
                        </div>
                    )}
                </span>
            </div>

            <canvas
                ref={canvasRef}
                onMouseDown={(e) => {
                    startDrawing(e);
                    draw(e);
                }}
                onTouchStart={(e) => {
                    startDrawing(e);
                    draw(e);
                }}
                onMouseMove={draw}
                onTouchMove={(e) => {
                    e.preventDefault();
                    draw(e);
                }}
                width={1280}
                height={720}
                className="h-[75%] w-[75%] aspect-video bg-white shadow-lg rounded-lg border-2 border-zinc-300"
            ></canvas>
        </div>
    );
});

export default DrawingCanvas;
