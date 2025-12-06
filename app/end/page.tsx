"use client";

export default function End() {
    return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 text-zinc-900 font-sans p-6">
            <main className="max-w-4xl text-center space-y-8">
                <div className="flex flex-col justify-center gap-4 items-center">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                        Game ended!
                    </h1>
                    <p className="text-zinc-700 text-xl">
                        The game has ended! Look at the screen to see the
                        winners, and losers...
                    </p>
                    <button
                        onClick={() => {
                            window.location.href = "/play";
                        }}
                        className="transition hover:scale-[1.1] text-zinc-700 p-2 bg-green-200 rounded-lg cursor-pointer max-w-64 w-64 "
                    >
                        Play again!
                    </button>
                </div>
            </main>
        </div>
    );
}
