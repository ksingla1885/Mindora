'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Map,
    CheckCircle2,
    Clock,
    FileText,
    PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Mock Data for Syllabus
const syllabusData = {
    "class9-math": {
        title: "Class 9 Mathematics",
        description: "Comprehensive coverage of Number Systems, Algebra, Geometry, and Mensuration.",
        chapters: [
            {
                title: "Number Systems",
                topics: ["Irrational Numbers", "Real Numbers and their Decimal Expansions", "Operations on Real Numbers", "Laws of Exponents for Real Numbers"],
                duration: "12 Hours",
                status: "Completed"
            },
            {
                title: "Polynomials",
                topics: ["Polynomials in One Variable", "Zeroes of a Polynomial", "Remainder Theorem", "Factorisation of Polynomials", "Algebraic Identities"],
                duration: "15 Hours",
                status: "In Progress"
            },
            {
                title: "Coordinate Geometry",
                topics: ["Cartesian System", "Plotting a Point in the Plane if its Coordinates are given"],
                duration: "8 Hours",
                status: "Locked"
            },
            {
                title: "Linear Equations in Two Variables",
                topics: ["Linear Equations", "Solution of a Linear Equation", "Graph of a Linear Equation in Two Variables"],
                duration: "10 Hours",
                status: "Locked"
            },
            {
                title: "Introduction to Euclid's Geometry",
                topics: ["Euclid's Definitions, Axioms and Postulates", "Equivalent Versions of Euclid's Fifth Postulate"],
                duration: "6 Hours",
                status: "Locked"
            },
            {
                title: "Lines and Angles",
                topics: ["Basic Terms and Definitions", "Intersecting Lines and Non-intersecting Lines", "Pairs of Angles", "Parallel Lines and a Transversal", "Lines Parallel to the Same Line", "Angle Sum Property of a Triangle"],
                duration: "14 Hours",
                status: "Locked"
            }
        ]
    },
    "class9-science": {
        title: "Class 9 Science",
        description: "Explore the fundamental concepts of Matter, Life, Motion, and Natural Resources.",
        chapters: [
            { title: "Matter in Our Surroundings", topics: ["Physical Nature of Matter", "Characteristics of Particles of Matter", "States of Matter", "Can Matter Change its State?", "Evaporation"], duration: "10 Hours", status: "Not Started" },
            { title: "Is Matter Around Us Pure", topics: ["What is a Mixture?", "What is a Solution?", "Separating the Components of a Mixture", "Physical and Chemical Changes", "What are the Types of Pure Substances?"], duration: "12 Hours", status: "Not Started" },
            { title: "Atoms and Molecules", topics: ["Laws of Chemical Combination", "What is an Atom?", "What is a Molecule?", "Writing Chemical Formulae", "Molecular Mass and Mole Concept"], duration: "14 Hours", status: "Not Started" },
            { title: "The Fundamental Unit of Life", topics: ["What are Living Organisms Made Up of?", "What is the Cell Made Up of?", "Cell Organelles"], duration: "10 Hours", status: "Not Started" }
        ]
    },
    "class10-math": {
        title: "Class 10 Mathematics",
        description: "Comprehensive coverage of Number Systems, Algebra, Geometry, and Mensuration tailored for Class 10 students.",
        chapters: [
            {
                title: "Real Numbers",
                topics: ["Introduction to Real Numbers", "The Fundamental Theorem of Arithmetic", "Revisiting Irrational Numbers", "Revisiting Rational Numbers and their Decimal Expansions"],
                duration: "12 Hours"
            },
            {
                title: "Polynomials",
                topics: ["Geometrical Meaning of the Zeroes of a Polynomial", "Relationship between Zeroes and Coefficients of a Polynomial", "Division Algorithm for Polynomials"],
                duration: "15 Hours"
            },
            {
                title: "Pair of Linear Equations in Two Variables",
                topics: ["Pair of Linear Equations", "Graphical Method of Solution", "Algebraic Methods of Solution (Substitution, Elimination, Cross-Multiplication)"],
                duration: "10 Hours"
            },
            {
                title: "Quadratic Equations",
                topics: ["Quadratic Equations", "Solution of a Quadratic Equation by Factorisation", "Solution by Completing the Square", "Nature of Roots"],
                duration: "12 Hours"
            },
            {
                title: "Arithmetic Progressions",
                topics: ["Arithmetic Progressions", "nth Term of an AP", "Sum of First n Terms of an AP"],
                duration: "10 Hours"
            },
            {
                title: "Triangles",
                topics: ["Similar Figures", "Similarity of Triangles", "Criteria for Similarity of Triangles", "Areas of Similar Triangles", "Pythagoras Theorem"],
                duration: "15 Hours"
            }
        ]
    },
    "class10-science": {
        title: "Class 10 Science",
        description: "Explore advanced concepts in Chemical Substances, World of Living, Natural Phenomena, and Natural Resources.",
        chapters: [
            {
                title: "Chemical Reactions and Equations",
                topics: ["Chemical Equations", "Types of Chemical Reactions", "Corrosion and Rancidity"],
                duration: "10 Hours"
            },
            {
                title: "Acids, Bases and Salts",
                topics: ["Understanding the Chemical Properties of Acids and Bases", "What do all Acids and all Bases have in common?", "More about Salts"],
                duration: "12 Hours"
            },
            {
                title: "Metals and Non-metals",
                topics: ["Physical Properties", "Chemical Properties of Metals", "How do Metals and Non-metals React?", "Occurrence of Metals", "Corrosion"],
                duration: "14 Hours"
            },
            {
                title: "Life Processes",
                topics: ["What are Life Processes?", "Nutrition", "Respiration", "Transportation", "Excretion"],
                duration: "16 Hours"
            },
            {
                title: "Light - Reflection and Refraction",
                topics: ["Reflection of Light", "Spherical Mirrors", "Refraction of Light"],
                duration: "14 Hours"
            },
            {
                title: "Electricity",
                topics: ["Electric Current and Circuit", "Electric Potential and Potential Difference", "Circuit Diagram", "Ohm's Law", "Factors on which the Resistance of a Conductor Depends"],
                duration: "12 Hours"
            }
        ]
    },
    "class11-math": {
        title: "Class 11 Mathematics",
        description: "Master the foundations of higher mathematics. From Sets and Functions to the complexities of Trigonometry and Algebra, prepare for competitive excellence.",
        chapters: [
            {
                title: "Sets",
                topics: ["Sets Representations", "Empty & Finite Sets", "Subsets & Power Sets", "Venn Diagrams"],
                duration: "12 Hours"
            },
            {
                title: "Relations & Functions",
                topics: ["Cartesian Product", "Domain & Range", "Types of Relations", "Graphs of Functions"],
                duration: "14 Hours"
            },
            {
                title: "Trigonometric Functions",
                topics: ["Angles & Measurement", "Trigonometric Functions", "Compound Angles", "Trigonometric Equations"],
                duration: "18 Hours"
            },
            {
                title: "Complex Numbers",
                topics: ["Algebra of Complex Numbers", "Argand Plane", "Polar Representation", "Quadratic Equations"],
                duration: "10 Hours"
            },
            {
                title: "Linear Inequalities",
                topics: ["Inequalities in One Variable", "Graphical Representation"],
                duration: "8 Hours"
            },
            {
                title: "Permutations and Combinations",
                topics: ["Fundamental Principle of Counting", "Permutations", "Combinations", "Factorial Notation"],
                duration: "12 Hours"
            }
        ]
    },
    "class11-physics": {
        title: "Class 11 Physics",
        description: "Understand the laws governing the universe, from kinematics to thermodynamics and waves.",
        chapters: [
            {
                title: "Units and Measurements",
                topics: ["SI Units", "Accuracy and Precision", "Errors in Measurement", "Dimensional Analysis"],
                duration: "8 Hours"
            },
            {
                title: "Motion in a Straight Line",
                topics: ["Position, Path Length and Displacement", "Average Velocity and Speed", "Relative Velocity"],
                duration: "10 Hours"
            },
            {
                title: "Laws of Motion",
                topics: ["Newton's Laws of Motion", "Conservation of Momentum", "Equilibrium of a Particle", "Friction"],
                duration: "14 Hours"
            },
            {
                title: "Work, Energy and Power",
                topics: ["Work-Energy Theorem", "Kinetic Energy", "Potential Energy", "Conservation of Mechanical Energy"],
                duration: "12 Hours"
            },
            {
                title: "Gravitation",
                topics: ["Kepler's Laws", "Universal Law of Gravitation", "Gravitational Potential Energy", "Escape Speed"],
                duration: "10 Hours"
            },
            {
                title: "Thermodynamics",
                topics: ["Thermal Equilibrium", "First Law of Thermodynamics", "Specific Heat Capacity", "Thermodynamic State Variables"],
                duration: "12 Hours"
            }
        ]
    },
    "class11-chemistry": {
        title: "Class 11 Chemistry",
        description: "Dive into the microscopic world of atoms, chemical bonding, and organic chemistry.",
        chapters: [
            {
                title: "Some Basic Concepts of Chemistry",
                topics: ["Importance of Chemistry", "Atomic and Molecular Masses", "Mole Concept and Molar Masses", "Stoichiometry"],
                duration: "10 Hours"
            },
            {
                title: "Structure of Atom",
                topics: ["Discovery of Sub-atomic Particles", "Bohr's Model of Atom", "Quantum Mechanical Model of Atom"],
                duration: "14 Hours"
            },
            {
                title: "Classification of Elements",
                topics: ["Periodic Trends in Properties of Elements", "Electronic Configurations and Types of Elements"],
                duration: "8 Hours"
            },
            {
                title: "Chemical Bonding",
                topics: ["Kossel-Lewis Approach", "Ionic or Electrovalent Bond", "VSEPR Theory", "Molecular Orbital Theory"],
                duration: "16 Hours"
            },
            {
                title: "Thermodynamics",
                topics: ["Applications of First Law", "Enthalpy Change", "Spontaneity", "Gibbs Energy Change"],
                duration: "12 Hours"
            },
            {
                title: "Hydrocarbons",
                topics: ["Alkanes", "Alkenes", "Alkynes", "Aromatic Hydrocarbons"],
                duration: "14 Hours"
            }
        ]
    },
    "class11-astro": {
        title: "Class 11 Astronomy",
        description: "Explore the cosmos, celestial mechanics, and the life cycles of stars.",
        chapters: [
            {
                title: "Celestial Mechanics",
                topics: ["Kepler's Laws of Planetary Motion", "Newton's Law of Universal Gravitation", "Orbits and Trajectories"],
                duration: "12 Hours"
            },
            {
                title: "The Solar System",
                topics: ["Formation of the Solar System", "The Sun", "Terrestrial and Jovian Planets", "Asteroids and Comets"],
                duration: "10 Hours"
            },
            {
                title: "Stellar Evolution",
                topics: ["Star Formation", "Main Sequence Stars", "Red Giants and Supergiants", "Supernovae", "Black Holes"],
                duration: "14 Hours"
            },
            {
                title: "Cosmology",
                topics: ["The Big Bang Theory", "Expansion of the Universe", "Dark Matter and Dark Energy"],
                duration: "10 Hours"
            },
            {
                title: "Observational Astronomy",
                topics: ["Telescopes", "Coordinate Systems", "Timekeeping", "Spectroscopy"],
                duration: "12 Hours"
            }
        ]
    },
    "class12-math": {
        title: "Class 12 Mathematics",
        description: "Final sprint towards competitive success. Relations, Calculus, Vectors, and Probability.",
        chapters: [
            {
                title: "Relations and Functions",
                topics: ["Types of Relations", "Types of Functions", "Composition of Functions", "Invertible Function"],
                duration: "12 Hours"
            },
            {
                title: "Inverse Trigonometric Functions",
                topics: ["Basic Concepts", "Properties of Inverse Trigonometric Functions"],
                duration: "8 Hours"
            },
            {
                title: "Matrices",
                topics: ["Matrix Operations", "Transpose of a Matrix", "Symmetric and Skew Symmetric Matrices", "Invertible Matrices"],
                duration: "10 Hours"
            },
            {
                title: "Determinants",
                topics: ["Properties of Determinants", "Area of a Triangle", "Minors and Cofactors", "Adjoint and Inverse of a Matrix"],
                duration: "10 Hours"
            },
            {
                title: "Continuity and Differentiability",
                topics: ["Continuity", "Differentiability", "Exponential and Logarithmic Functions", "Derivatives of Functions in Parametric Forms"],
                duration: "14 Hours"
            },
            {
                title: "Integrals",
                topics: ["Integration as Inverse Process of Differentiation", "Methods of Integration", "Integrals of Some Particular Functions", "Definite Integral"],
                duration: "16 Hours"
            }
        ]
    },
    "class12-physics": {
        title: "Class 12 Physics",
        description: "Master electromagnetism, optics, and modern physics for board exams and entrance tests.",
        chapters: [
            {
                title: "Electric Charges and Fields",
                topics: ["Electric Charge", "Coulomb's Law", "Electric Field", "Electric Flux", "Gauss's Law"],
                duration: "12 Hours"
            },
            {
                title: "Electrostatic Potential and Capacitance",
                topics: ["Electrostatic Potential", "Potential due to a Point Charge", "Equipotential Surfaces", "Capacitors and Capacitance"],
                duration: "10 Hours"
            },
            {
                title: "Current Electricity",
                topics: ["Electric Current", "Ohm's Law", "Drift of Electrons", "Resistivity", "Kirchhoff's Rules"],
                duration: "12 Hours"
            },
            {
                title: "Moving Charges and Magnetism",
                topics: ["Magnetic Force", "Motion in a Magnetic Field", "Biot-Savart Law", "Ampere's Circuital Law"],
                duration: "12 Hours"
            },
            {
                title: "Ray Optics and Optical Instruments",
                topics: ["Reflection of Light by Spherical Mirrors", "Refraction", "Total Internal Reflection", "Refraction at Spherical Surfaces"],
                duration: "14 Hours"
            },
            {
                title: "Semiconductor Electronics",
                topics: ["Classification of Metals, Conductors and Semiconductors", "Intrinsic Semiconductor", "Extrinsic Semiconductor", "p-n Junction"],
                duration: "10 Hours"
            }
        ]
    },
    "class12-chemistry": {
        title: "Class 12 Chemistry",
        description: "Advanced study of Solutions, Electrochemistry, Kinetics, and Organic Chemistry.",
        chapters: [
            {
                title: "Solutions",
                topics: ["Types of Solutions", "Expressing Concentration of Solutions", "Solubility", "Vapour Pressure of Liquid Solutions"],
                duration: "10 Hours"
            },
            {
                title: "Electrochemistry",
                topics: ["Electrochemical Cells", "Galvanic Cells", "Nernst Equation", "Conductance of Electrolytic Solutions"],
                duration: "12 Hours"
            },
            {
                title: "Chemical Kinetics",
                topics: ["Rate of a Chemical Reaction", "Factors Influencing Rate of a Reaction", "Integrated Rate Equations"],
                duration: "10 Hours"
            },
            {
                title: "d and f Block Elements",
                topics: ["Position in the Periodic Table", "Electronic Configurations of the d-Block Elements", "General Properties of the Transition Elements"],
                duration: "10 Hours"
            },
            {
                title: "Coordination Compounds",
                topics: ["Werner's Theory of Coordination Compounds", "Definitions of Some Important Terms Pertaining to Coordination Compounds", "Nomenclature"],
                duration: "12 Hours"
            },
            {
                title: "Haloalkanes and Haloarenes",
                topics: ["Classification", "Nomenclature", "Nature of C-X Bond", "Methods of Preparation"],
                duration: "14 Hours"
            }
        ]
    },
    "class12-astro": {
        title: "Class 12 Astronomy",
        description: "Advanced topics in Galactic Astronomy, Astrophysics, and Space Exploration.",
        chapters: [
            {
                title: "Galactic Structure",
                topics: ["The Milky Way", "Structure of Galaxies", "Spiral Arms", "Galactic Rotation"],
                duration: "12 Hours"
            },
            {
                title: "Extragalactic Astronomy",
                topics: ["Galaxy Classification", "Hubble Sequence", "Active Galactic Nuclei", "Quasars"],
                duration: "12 Hours"
            },
            {
                title: "Exoplanets",
                topics: ["Detection Methods", "Transit Photometry", "Radial Velocity", "Habitable Zones"],
                duration: "10 Hours"
            },
            {
                title: "High Energy Astrophysics",
                topics: ["Cosmic Rays", "Gamma-Ray Bursts", "Neutron Stars", "Pulsars"],
                duration: "12 Hours"
            },
            {
                title: "Space Exploration",
                topics: ["History of Spaceflight", "Orbital Mechanics", "Future Missions", "Space Telescopes"],
                duration: "10 Hours"
            }
        ]
    },
    // Add fallbacks for other subjects to avoid crashes
    "default": {
        title: "Syllabus Overview",
        description: "Detailed syllabus content is being curated for this subject.",
        chapters: [
            { title: "Introduction", topics: ["Course Overview", "Prerequisites", "Learning Outcomes"], duration: "2 Hours", status: "Available" },
            { title: "Module 1", topics: ["Topic 1.1", "Topic 1.2", "Topic 1.3"], duration: "5 Hours", status: "Locked" }
        ]
    }
};

export default function SubjectSyllabusPage() {
    const params = useParams();
    const router = useRouter();
    const subjectId = params.subjectId;

    const data = syllabusData[subjectId] || syllabusData["default"];
    // If defaulting, we might want to use the ID to format a title nicely
    const displayTitle = syllabusData[subjectId] ? data.title : subjectId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                suppressHydrationWarning
                className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Subjects
            </button>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{displayTitle}</h1>
                </div>
                <p className="text-lg text-muted-foreground ml-1">{data.description}</p>
            </motion.div>

            {/* Syllabus List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Map className="w-5 h-5 text-indigo-500" />
                        Curriculum Path
                    </h2>
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {data.chapters.length} Modules
                    </span>
                </div>

                {data.chapters.map((chapter, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                        {/* Chapter Header */}
                        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">
                                    Chapter {index + 1}
                                </span>
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {chapter.title}
                                </h3>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                                <Clock className="w-4 h-4 mr-1.5" />
                                {chapter.duration}
                            </div>
                        </div>

                        {/* Topics List */}
                        <div className="p-6">
                            <div className="mb-5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Key Topics</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                                    {chapter.topics.map((topic, tIndex) => (
                                        <div key={tIndex} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                                            <span className="text-sm text-foreground/90">{topic}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-5 border-t border-border flex flex-wrap gap-4">
                                <button
                                    suppressHydrationWarning
                                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    Watch Lectures
                                </button>
                                <button
                                    suppressHydrationWarning
                                    className="inline-flex items-center px-4 py-2 bg-background text-foreground border border-border text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    View Notes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
