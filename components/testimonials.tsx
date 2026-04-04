
const testimonials = [
    {
        name: "Emily Carter",
        role: "Marketing Specialist",
        quote:
            "BoostCV helped me rebuild my resume in one evening. I got two interview calls within a week.",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
        name: "Michael Johnson",
        role: "Frontend Developer",
        quote:
            "The templates look professional and the AI suggestions made my experience section way stronger.",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        name: "Sophia Lee",
        role: "Operations Analyst",
        quote:
            "I love how fast the whole process is. From draft to final resume took less than 20 minutes.",
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
];

export function Testimonials() {
    return (
        <section className="bg-white py-20 dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                        What Our Users Say
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
                        Real feedback from professionals who used Craftiv to improve their job applications.
                    </p>
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <article
                            key={testimonial.name}
                            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={testimonial.avatar}
                                    alt={`${testimonial.name} profile`}
                                    className="h-12 w-12 rounded-full object-cover"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="font-semibold text-zinc-900 dark:text-white">{testimonial.name}</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.role}</p>
                                </div>
                            </div>

                            <p className="mt-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                                &quot;{testimonial.quote}&quot;
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}