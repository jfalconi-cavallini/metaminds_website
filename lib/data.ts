export const siteData = {
    brand: {
        name: "MetaMinds STEM Academy",
        location: "DFW Metroplex",
        email: "metamindsstemacademy@gmail.com",
        tagline: "Expert Tutoring for SAT, ACT, AP, GED & STEM",
        description: "1-on-1 tutoring from working engineers and scientists holding B.S. and M.S. degrees from UC San Diego and UC Berkeley. SAT/ACT/GED prep, K-12 math, coding, and advanced STEM mentoring.",
    },

    hero: {
        // Only formUrl is live (read by /consultation) — headline/stats fields were
        // removed here since the homepage hero renders its own copy and nothing
        // else read them.
        formUrl: "https://calendly.com/metamindsstemacademy/metaminds-free-consultation", // UPDATE WITH YOUR CALENDLY LINK
    },

    trustBar: [
        { label: "Students Helped", value: "500+" },
        { label: "Avg SAT Improvement", value: "+200pts" },
        { label: "Tutor Degrees", value: "B.S. / M.S." },
        { label: "Success Rate", value: "98%" },
    ],

    testimonials: [
        {
            quote: "My SAT score went from 1050 to 1310. The personalized approach really made the difference.",
            author: "Sarah J.",
            role: "SAT Student",
        },
        {
            quote: "Finally understand coding. Best investment in my son's education.",
            author: "Parent of Alex",
            role: "Python Student",
        },
        {
            quote: "Got into my dream college. Couldn't have done it without this tutoring.",
            author: "Michael K.",
            role: "SAT Student",
        },
    ],

    platform: {
        headline: "Every Session Leaves a Trail You Can See",
        subheadline: "Most tutoring disappears the moment the session ends. Ours doesn't — every session, skill, and assignment lives in one place for you and your family.",
        features: [
            {
                icon: "Users",
                title: "One Mentor, Not a Rotation",
                description: "Your child is matched with a dedicated tutor who stays with them — not whoever happens to be free that week.",
            },
            {
                icon: "FileText",
                title: "Session Notes, Every Time",
                description: "What was covered, what to review, what's next. Posted to the parent and student portal after every single session — no exceptions.",
            },
            {
                icon: "TrendingUp",
                title: "Skill Tracking, Not Just Grades",
                description: "Algebra, geometry, and trig aren't the same skill. We track mastery skill-by-skill, so you know exactly what's solid and what still needs work.",
            },
            {
                icon: "BookOpen",
                title: "Homework With Real Feedback",
                description: "Assigned after each session and graded by your tutor — not an answer key, and not busywork.",
            },
            {
                icon: "MessageSquare",
                title: "Direct Parent Updates",
                description: "Updates come from the person who actually taught the session, not a form email on a schedule.",
            },
            {
                icon: "GraduationCap",
                title: "K–12 Through College, One System",
                description: "Students can stay with MetaMinds from elementary school through AP exams and beyond — same tutor relationship, same tracked history, no starting over.",
            },
        ],
    },

    referral: {
        headline: "Love MetaMinds? Share It.",
        description: "Refer a friend or family member who purchases a 4-hour or 8-hour package and we'll add 1 free tutoring hour to your account — automatically. No limits, refer as many people as you like.",
        badge: "Free Hour for Every Referral",
    },

    faqs: [
        {
            question: "How long does a typical session last?",
            answer: "Most sessions are 60 minutes, though we offer flexible scheduling from 30 minutes to 2-hour deep-dives. You choose what works best for you.",
        },
        {
            question: "What's the cost of tutoring?",
            answer: "Packages start at $70 for a single session, and drop as low as $50/hr on our 20-hour package. Book a free consultation and we'll walk you through which tier and package fit your goals.",
        },
        {
            question: "How much can I improve my SAT/ACT score?",
            answer: "Students we've worked with have seen 200+ point SAT improvements, with others reaching 1500+ scores. Results depend on starting point, consistency, and effort — individual results vary.",
        },
        {
            question: "Can I schedule sessions around my school schedule?",
            answer: "Yes! We offer evening and weekend sessions. Book any time that works for you through our Calendly link.",
        },
        {
            question: "Do you offer group tutoring?",
            answer: "We specialize in 1-on-1 personalized tutoring, but we can discuss group options if needed. Contact us to explore alternatives.",
        },
        {
            question: "Do you have a referral program?",
            answer: "Yes! Refer a friend or family member who purchases a 4-hour or 8-hour package and we'll add 1 free tutoring hour to your account as a thank-you. There's no limit to how many people you can refer.",
        },
        {
            question: "What if I'm not satisfied?",
            answer: "We offer a money-back guarantee if you're not satisfied after your first session. No questions asked. Your satisfaction is our priority.",
        },
        {
            question: "What technology do I need?",
            answer: "Just a computer with internet, a webcam, and a microphone. We use Zoom for video sessions and can share screens for coding and problem-solving.",
        },
    ],

    nav: [
        { label: "Platform", href: "#platform" },
        { label: "Our Team", href: "#team" },
        { label: "Pricing", href: "#pricing" },
        { label: "Programs", href: "#programs" },
        { label: "Results", href: "#results" },
        { label: "FAQ", href: "#faq" },
    ],

    // ==================== PRESERVED FROM ORIGINAL ====================
    // These sections can be used for future features or Phase 1

    founders: [
        {
            name: "Jose Falconi-Cavallini",
            title: "CEO & Co-Founder · CS & SAT/ACT Tutor",
            image: "/images/tutors/jose_tutor_1024_square.jpg",
            credentials: [
                "B.S. Computer Science, UC San Diego",
                "CEO & Co-Founder, MetaMinds STEM Academy",
                "Former Professional Tutor, Revolution Prep",
                "7+ years STEM teaching experience",
            ],
            bio: "Jose founded MetaMinds after years as a professional tutor at Revolution Prep, where he saw firsthand how much families were overpaying for results they could get better — directly from the tutor. A CS graduate from UC San Diego, he built this platform so students get elite instruction without the corporate markup.",
        },
        {
            name: "Emma Brugman",
            title: "Co-Founder · ML, Data Science & SAT/ACT Tutor",
            image: "/images/tutors/emma_tutor_1024_square.jpg",
            credentials: [
                "B.S. Cognitive & Behavioral Neuroscience, UC San Diego",
                "M.S. Molecular Science & Software Engineering, UC Berkeley",
                "Data & Machine Learning Analyst (Industry)",
                "Former Professional Tutor, Revolution Prep",
            ],
            bio: "Emma brings neuroscience, machine learning, and software engineering together to help students understand how they learn — and how to learn faster. She designs curriculum grounded in how the brain actually processes information, making complex topics click.",
        },
        {
            name: "Johan Falconi-Cavallini",
            title: "Co-Founder · Engineering & Math Tutor",
            image: "/images/tutors/johan_tutor_1024_square.jpg",
            credentials: [
                "B.S. Civil Engineering, UC Merced",
                "Former Professional Tutor, Revolution Prep",
                "Engineering & structural analysis specialist",
                "3+ years STEM teaching experience",
            ],
            bio: "Johan brings a civil engineering mindset to every session, helping students build real problem-solving skills from the ground up. His strength is making abstract math and physics concepts concrete through the lens of how real structures and systems are designed.",
        },
        {
            name: "Roberto Medina",
            title: "R&D / Design Engineer & STEM Tutor",
            image: "/images/tutors/roberto_tutor_1024_square.jpg",
            credentials: [
                "B.S. Mechanical Engineering, UC San Diego",
                "R&D / Design Engineer (Industry)",
                "Advanced CAD & mechanical design",
                "Former tutor at Juni Learning",
            ],
            bio: "Roberto works as an R&D and design engineer and brings that real-world perspective into every session. Students learn not just how to solve problems, but how engineers actually design and iterate on solutions — building skills that transfer far beyond the classroom.",
        },
        {
            name: "Alan Martinez",
            title: "Hardware Validation Engineer & STEM Tutor",
            image: "/images/tutors/alan_tutor_1024_square.jpg",
            credentials: [
                "B.S. Electrical Engineering, UC San Diego",
                "Hardware Validation Engineer (Industry)",
                "Robotics, embedded systems & electronics",
                "STEM instructor & engineering mentor",
            ],
            bio: "Alan is a practicing hardware validation engineer who teaches students how electronics and embedded systems actually work in industry. From circuit design to robotics programming, he helps students bridge the gap between textbook theory and professional engineering.",
        },
        {
            name: "Christian Tapia",
            title: "Mathematics & CS Tutor · MBA Candidate",
            image: "/images/tutors/christian_tutor_1024_square.jpg",
            credentials: [
                "B.S. Mathematics–Computer Science, UC San Diego",
                "MBA Candidate, Georgia Institute of Technology",
                "Professional tutor at EdLadder",
            ],
            bio: "Christian holds a B.S. in Mathematics–Computer Science and an M.S. in Business Analytics from UC San Diego, and is currently pursuing his MBA at Georgia Tech. He specializes in mathematics, programming, and data-driven problem solving — helping students build analytical and coding skills grounded in both engineering and business.",
        },
    ],

    gallery: {
        title: "See Us in Action",
        subtitle: "Real moments from our tutoring sessions and camps.",
        images: [
            {
                src: "/images/gallery/camp1.jpg",
                alt: "1-on-1 tutoring session",
                caption: "Personalized online tutoring",
            },
            {
                src: "/images/gallery/camp2.jpg",
                alt: "Student coding project",
                caption: "Live coding session",
            },
            {
                src: "/images/gallery/camp3.jpg",
                alt: "SAT prep session",
                caption: "Test prep strategy session",
            },
            {
                src: "/images/gallery/camp4.jpg",
                alt: "Group learning",
                caption: "Collaborative problem solving",
            },
            {
                src: "/images/gallery/camp5.jpg",
                alt: "Project showcase",
                caption: "Student project presentations",
            },
            {
                src: "/images/gallery/camp6.jpg",
                alt: "Instructor support",
                caption: "Expert guidance and support",
            },
            {
                src: "/images/gallery/camp7.jpg",
                alt: "Success celebration",
                caption: "Celebrating student achievements",
            },
            {
                src: "/images/gallery/camp8.jpg",
                alt: "Robotics mentoring",
                caption: "Advanced robotics instruction",
            },
            {
                src: "/images/gallery/camp9.jpg",
                alt: "STEM learning",
                caption: "Hands-on STEM mentoring",
            },
        ],
    },

    // ==================== FUTURE PHASES (keep for reference) ====================
    // These are not used in Phase 0 but preserved for future camp/robotics features
    
    campWeeks: [
        {
            dates: "June 15–19",
            status: "available",
            theme: "Robot Restaurant",
            description: "Engineer a fully automated robot kitchen and delivery system",
        },
        {
            dates: "June 22–26",
            status: "available",
            theme: "Superhero Tech Lab",
            description: "Build gadgets and robots inspired by your favorite heroes",
        },
        {
            dates: "June 29–July 3",
            status: "available",
            theme: "Zombie Apocalypse Survival",
            description: "Create defense robots and automated survival systems",
        },
        {
            dates: "July 6–10",
            status: "available",
            theme: "Treasure Hunter Bots",
            description: "Design robots that search, map, and recover hidden treasures",
        },
        {
            dates: "July 13–17",
            status: "available",
            theme: "Animal Kingdom Robots",
            description: "Build biomimetic robots inspired by nature's best designs",
        },
        {
            dates: "July 20–24",
            status: "available",
            theme: "Time Travel Engineers",
            description: "Create robots from different eras: ancient, medieval, future",
        },
        {
            dates: "July 27–31",
            status: "available",
            theme: "Robot Olympics",
            description: "Train robots for extreme sports and athletic competitions",
        },
        {
            dates: "August 3–7",
            status: "available",
            theme: "Spy Tech & Secret Agents",
            description: "Build surveillance bots, code-breaking systems, and stealth tech",
        },
        {
            dates: "August 10–14",
            status: "available",
            theme: "Alien Invasion Defense",
            description: "Engineer planetary defense systems and alien contact robots",
        },
    ],
};