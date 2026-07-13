export const siteData = {
    brand: {
        name: "MetaMinds STEM Academy",
        location: "DFW Metroplex",
        email: "metamindsstemacademy@gmail.com",
        tagline: "Expert Tutoring for SAT, ACT, AP, GED & STEM",
        description: "1-on-1 tutoring from working engineers and scientists holding B.S. and M.S. degrees from UC San Diego and UC Berkeley. SAT/ACT/GED prep, K-12 math, coding, and advanced STEM mentoring.",
    },

    hero: {
        headline: "Tutored by Real Engineers & Scientists",
        subheadline: "Not grad students — working professionals. Our tutors hold B.S. and M.S. degrees in Engineering and Computer Science from UC San Diego & UC Berkeley and work in industry every day.",
        cta1: "Book Free Consultation",
        cta2: "View Programs",
        formUrl: "https://calendly.com/metamindsstemacademy/metaminds-free-consultation", // UPDATE WITH YOUR CALENDLY LINK
        stats: {
            students: "500+",
            satImprovement: "+200pts",
            successRate: "98%",
        },
    },

    trustBar: [
        { label: "Students Helped", value: "500+" },
        { label: "Avg SAT Improvement", value: "+200pts" },
        { label: "Tutor Degrees", value: "B.S. / M.S." },
        { label: "Success Rate", value: "98%" },
    ],

    services: [
        {
            id: "sat-act",
            title: "SAT & ACT Prep",
            description: "Comprehensive test prep with proven score improvements. Average +200 SAT points.",
            features: ["Full-length practice tests", "Targeted weak area focus", "Test-day strategy"],
            icon: "📚",
        },
        {
            id: "ap",
            title: "AP Exam Prep",
            description: "Targeted prep for AP exams from tutors who know the material at a professional level. Calculus, Physics, Chemistry, CS, Biology, Statistics, and more.",
            features: ["All major AP subjects", "Free-response & essay strategy", "Score improvement focus"],
            icon: "🏆",
        },
        {
            id: "ged",
            title: "GED Test Prep",
            description: "Get your diploma with 1-on-1 prep across all four GED subjects. Flexible scheduling around your life.",
            features: ["Math, Science, RLA & Social Studies", "Practice tests & strategy", "Flexible scheduling"],
            icon: "🎓",
        },
        {
            id: "math",
            title: "K-12 Math Tutoring",
            description: "Master any math topic from algebra to calculus. Personalized to your pace.",
            features: ["All grade levels", "Homework help", "Concept mastery"],
            icon: "🔢",
        },
        {
            id: "coding",
            title: "Coding & Programming",
            description: "Learn Python, JavaScript, Java, and web development from active software engineers.",
            features: ["Real projects", "Portfolio building", "Interview prep"],
            icon: "💻",
        },
        {
            id: "stem",
            title: "STEM Mentoring",
            description: "Advanced mentorship in CS, robotics, AI, and engineering from working professionals.",
            features: ["Industry-experienced mentors", "Portfolio projects", "Career guidance"],
            icon: "🚀",
        },
    ],

    whyUs: [
        {
            title: "Working Professionals, Not Grad Students",
            description: "Every tutor holds a B.S. or M.S. in Engineering or Computer Science from UC San Diego or UC Berkeley — and works in industry today. You get real-world expertise, not textbook knowledge.",
        },
        {
            title: "Proven Results",
            description: "Average SAT improvement of +200 points. 500+ students helped. Real success stories from students at every level.",
        },
        {
            title: "Truly Personalized",
            description: "1-on-1 sessions built around your goals, pace, and learning style. No shared classes, no cookie-cutter plans.",
        },
        {
            title: "Flexible & Affordable",
            description: "Evening and weekend sessions that fit your schedule. Transparent pricing, no hidden fees, money-back guarantee.",
        },
    ],

    results: [
        { before: 1050, after: 1310, student: "Sarah J." },
        { before: 1200, after: 1470, student: "Michael K." },
        { before: 980, after: 1200, student: "Emma T." },
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

    howItWorks: [
        {
            step: "1",
            title: "Book Free Consultation",
            description: "Tell us your goals. We'll assess your needs and create a personalized plan.",
        },
        {
            step: "2",
            title: "Start 1-on-1 Sessions",
            description: "Meet with your tutor online. Real-time feedback, screen sharing, and live coding.",
        },
        {
            step: "3",
            title: "Track Progress",
            description: "Regular check-ins and progress reports. See improvement in real-time.",
        },
        {
            step: "4",
            title: "Achieve Your Goals",
            description: "SAT/ACT scores, college admission, coding mastery, or career readiness.",
        },
    ],

    pricing: {
        packages: [
            {
                name: "Single Session",
                price: "$70",
                pricePerHour: "$70/hr",
                duration: "1 Hour",
                description: "Perfect for trying out 1-on-1 tutoring or getting targeted help on a specific topic.",
                badge: null,
            },
            {
                name: "4-Hour Package",
                price: "$260",
                pricePerHour: "$65/hr",
                duration: "4 Hours Total",
                description: "Best for focused skill-building or multi-session test prep.",
                badge: null,
            },
            {
                name: "8-Hour Package",
                price: "$480",
                pricePerHour: "$60/hr",
                duration: "8 Hours Total",
                description: "Our most popular package — deep mastery, consistent progress, and measurable results.",
                badge: "Most Popular",
            },
            {
                name: "20-Hour Package",
                price: "$1,000",
                pricePerHour: "$50/hr",
                duration: "20 Hours Total",
                description: "Maximum value for families committed to real transformation. Our best rate — reserved for serious students.",
                badge: "Best Value",
            },
        ],
        competitors: [
            { name: "TKO Prep", pricePerHour: "$200+/hr", type: "Premium test prep service", url: "https://www.tkoprep.com/tutoring" },
            { name: "Princeton Review", pricePerHour: "$200+/hr", type: "Large franchise model", url: "https://www.princetonreview.com/college/sat-test-prep?ceid=promo-sat" },
            { name: "Revolution Prep", pricePerHour: "$200+/hr", type: "Corporate tutoring company", url: "https://www.revolutionprep.com/programs/test-prep/sat/" },
        ],
        differentiators: [
            "No middleman — your money goes directly to your tutor, not a sales team",
            "Built by tutors, for students. The mission is results, not profit margins.",
            "Same elite credentials: degreed professionals actively working in their fields",
            "No long-term contracts. Cancel or pause anytime.",
        ],
    },

    platform: {
        headline: "A Learning Platform Built by Tutors, for Students",
        subheadline: "Not just 1-on-1 sessions — a complete ecosystem designed to accelerate your growth between sessions.",
        features: [
            {
                icon: "Brain",
                title: "AI-Generated Homework",
                description: "Every assignment is generated by AI trained on your tutor's feedback, your past homework, and your test performance — personalized to exactly where you need to improve.",
            },
            {
                icon: "BookOpen",
                title: "Interactive Curriculum",
                description: "A living curriculum embedded in your student account. Lessons, quizzes, and practice problems that adapt as you progress.",
            },
            {
                icon: "MessageSquare",
                title: "Student Community Hub",
                description: "A Discord-like space where students connect, share resources, ask questions, and support each other — moderated and monitored by your tutors.",
            },
            {
                icon: "Users",
                title: "Study Groups",
                description: "Join or create study groups for SAT prep, AP subjects, or coding projects. Peer learning accelerates growth beyond the session.",
            },
            {
                icon: "Rocket",
                title: "Private Project Rooms",
                description: "Students can create private collaborative spaces for business ideas, 3D printing projects, entrepreneurship ventures, and personal builds.",
            },
            {
                icon: "Shield",
                title: "Tutor-Monitored Spaces",
                description: "All group spaces are overseen by your tutors. Get guidance and mentorship even outside of your scheduled sessions.",
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
            answer: "Our packages start at $70 for a single session. With our 20-hour package you pay as little as $50/hr — compared to $200+/hr at companies like Revolution Prep and Princeton Review. Same elite credentials, no middleman markup. We also offer a money-back guarantee if you're not satisfied after your first session.",
        },
        {
            question: "How much can I improve my SAT/ACT score?",
            answer: "Our average student improves by 200+ SAT points or 3+ ACT points within 8-12 weeks with consistent practice. Results vary based on starting score and effort.",
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
            answer: "Just a computer with internet, a webcam, and a microphone. We use Zoom for video sessions and can share screens for coding/problem-solving.",
        },
        {
            question: "How do I prepare for my first session?",
            answer: "Have your goals ready and any materials related to what you want to learn. We'll handle the rest! Our instructors will guide you through everything.",
        },
    ],

    cta: {
        headline: "Ready to Get Started?",
        subheadline: "Book a free 30-minute consultation with one of our tutors. No commitment. No pressure.",
        buttonText: "Book Free Consultation",
    },

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