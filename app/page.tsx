"use client";

export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-900 font-sans p-6">
            <main className="max-w-3xl text-center space-y-8">
                {/* Header */}
                <header className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-800">
                        Welcome to Weird Inventions
                    </h1>
                    <p className="text-lg text-zinc-600">
                        The chaotic party game where creativity peaks.
                    </p>
                </header>

                {/* What is this */}
                <section className="space-y-4 text-zinc-700 leading-relaxed">
                    <h2 className="text-2xl font-semibold">What is this?</h2>
                    <p>
                        Imagine a bunch of your friends crowding around one
                        screen, each making up the most wacky invention ideas
                        known. Up to 12 players can play at once. This would be
                        more if I had better means of hosting.
                    </p>

                    <h2 className="text-2xl font-semibold">Don't worry!</h2>
                    <p>
                        This game is simple enough that even your sleep-deprived
                        brain can handle it:
                    </p>

                    <ol className="list-decimal list-inside text-left mx-auto max-w-2xl space-y-1">
                        <li>
                            Players join and pick a username{" "}
                            <b>(16 max letters)</b>
                        </li>
                        <li>
                            Everyone creates a cursed invention idea{" "}
                            <b>(Waits for everyone to finish cooking)</b>
                        </li>
                        <li>
                            You get to draw someone else's idea to draw{" "}
                            <b>(1m 30s to draw)</b>
                        </li>
                        <li>
                            The group presents & votes on the best
                            fail's/solution's <b>(1m for each presentation)</b>
                        </li>
                    </ol>
                </section>

                {/* How it works */}
                <section className="space-y-4 text-zinc-700 leading-relaxed">
                    <h2 className="text-2xl font-semibold">
                        How does it work (gets nerdy here)
                    </h2>
                    <p>
                        Originally I created a game like this and is still
                        available on my GitHub{" "}
                        <a
                            className="text-blue-500 underline"
                            href="https://github.com/maximilian1121/Chaotic-Inventors"
                        >
                            here
                        </a>
                        . After that I created it again but with PlayroomKit
                        this code is not available anymore. I then created this
                        one in <b>React</b>, <b>Next.js</b>, <b>Socket.IO</b>,
                        and <b>Tailwind</b>. Thanks to{" "}
                        <a
                            href="render.com"
                            className="text-blue-500 underline"
                        >
                            render.com
                        </a>{" "}
                        I can host the backend websocket server for free. Their
                        free plan may be limited however the backend server is
                        actually pretty light-weight. It's probably not the best
                        choice to use Python for the backend but it was just my
                        personal favorite for making Socket.IO servers.
                    </p>
                </section>

                {/* Play buttons */}
                <section className="space-y-4 text-zinc-700 leading-relaxed">
                    <h2 className="text-2xl font-semibold">
                        Wheres the play button already!?!??!
                    </h2>
                    <div className="flex flex-row flex-wrap gap-4 justify-center">
                        <a
                            href="/host"
                            className="shadow-md hidden sm:block text-zinc-700 bg-zinc-200 font-bold py-3 px-6 rounded-xl w-60 transition hover:scale-[1.1]"
                        >
                            Host a game!
                            <img
                                src={"/host_game.png"}
                                width={128}
                                height={128}
                                alt="Host game image"
                                className="shadow-md rendering-pixelated rounded-lg border-zinc-700 border-2 w-full cursor-pointer"
                            />
                        </a>
                        <a
                            href="/play"
                            className="shadow-md text-zinc-700 bg-zinc-200 font-bold py-3 px-6 rounded-xl w-60 transition hover:scale-[1.1]"
                        >
                            Play!
                            <img
                                src={"/join_game.png"}
                                width={128}
                                height={128}
                                alt="Join game image"
                                className="shadow-md rendering-pixelated rounded-lg border-zinc-7-0 border-2 w-full cursor-pointer"
                            />
                        </a>
                        <p className="text-zinc-700 block sm:hidden">
                            The host button does not appear on smaller screens,
                            because it's harder to develop for and will never be
                            supported.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
