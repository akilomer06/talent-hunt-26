import { renderToString } from "react-dom/server";
import { Link, NavLink, Route, Routes, StaticRouter, useLocation, useNavigationType, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Component, useEffect, useId, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/data/siteData.ts
var technical = [
	"Code Break",
	"Code Canvas",
	"Neural Nexus",
	"Binary Battle",
	"Game Craft",
	"Tech Talks",
	"Cyber Breach",
	"Prompt Pop"
];
var nonTechnical = [
	"Shutter Verse",
	"Clue Code",
	"Trashion",
	"The Voice Over",
	"BGMI",
	"FIFA",
	"Valorant",
	"Bid Wars"
];
var slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
var siteData = {
	settings: {
		title: "TALENT HUNT 2K26",
		date: "2026-10-26",
		dateLabel: "26 October 2026",
		weekday: "Monday",
		college: "B.S. Abdur Rahman Crescent Institute of Science & Technology",
		school: "School of Computer Information and Mathematical Sciences",
		department: "Department of Computer Science and Engineering",
		venue: "Auditorium · B.S. Abdur Rahman Crescent",
		address: null,
		directions: [],
		eligibility: "For Crescent CSE students only",
		eligibilityNote: "Participation is restricted to Crescent students only. The official brochure specifies “ONLY FOR CSE.”",
		productionUrl: null,
		copyright: "TALENT HUNT 2K26 · Department of Computer Science and Engineering",
		archiveMessage: "The 2026 edition has concluded. Explore the event archive.",
		eventConcludedMessage: "The countdown has ended. Explore Talent Hunt 2K26."
	},
	assets: {
		college: "/assets/logos/crescent.png",
		event: "/assets/logos/talent-hunt.png",
		csea: "/assets/logos/csea.png",
		acm: "/assets/logos/acm.png",
		brochureImage: "/assets/documents/brochure.jpg",
		brochurePdf: null,
		defaultSocial: null,
		introAudio: null,
		favicon: "/assets/logos/talent-hunt.png"
	},
	countdown: {
		enabled: false,
		startsAt: null,
		timezone: null
	},
	registration: {
		url: null,
		qr: null,
		qrVerified: false,
		opensAt: null,
		closesAt: null,
		timezone: null,
		instructions: []
	},
	announcements: [],
	events: [["technical", technical], ["non-technical", nonTechnical]].flatMap(([category, names]) => names.map((name, index) => ({
		id: slugify(name),
		slug: slugify(name),
		name,
		category,
		order: index + 1,
		tags: [],
		rules: [],
		participation: [],
		rounds: [],
		equipment: [],
		prizes: [],
		faculty: [],
		students: [],
		faqs: [],
		relatedIds: []
	}))),
	featuredIds: [
		"code-break",
		"shutter-verse",
		"neural-nexus",
		"trashion"
	],
	schedule: [],
	coordinators: [{
		id: "sharmila-sankar",
		name: "Dr. Sharmila Sankar",
		role: "Convenor · Dean, SCIMS"
	}, {
		id: "aisha-banu",
		name: "Dr. W. Aisha Banu",
		role: "Convenor · HOD, CSE"
	}],
	coordinatorGroups: [
		{
			id: "faculty",
			label: "Faculty Coordinators",
			members: [
				{
					id: "sharmila-sankar",
					name: "Dr. Sharmila Sankar",
					role: "Convenor · Dean, SCIMS"
				},
				{
					id: "aisha-banu",
					name: "Dr. W. Aisha Banu",
					role: "Convenor · HOD, CSE"
				},
				{
					id: "faculty-coordinator-1",
					name: "Dr. M. Rajasekar",
					role: "Faculty Coordinator"
				},
				{
					id: "faculty-coordinator-2",
					name: "Dr. S. Kavitha",
					role: "Faculty Coordinator"
				},
				{
					id: "faculty-coordinator-3",
					name: "Mr. A. Farook",
					role: "Faculty Coordinator"
				}
			]
		},
		{
			id: "student-general",
			label: "Student General Coordinators",
			members: [
				{
					id: "sg-1",
					name: "Musthafaa A",
					role: "General Coordinator"
				},
				{
					id: "sg-2",
					name: "Fawaz M",
					role: "General Coordinator"
				},
				{
					id: "sg-3",
					name: "Shifana M",
					role: "General Coordinator"
				},
				{
					id: "sg-4",
					name: "Divya R",
					role: "General Coordinator"
				}
			]
		},
		{
			id: "technical-coords",
			label: "Technical Event Coordinators",
			members: [
				{
					id: "t-cb-1",
					name: "Akbar Ali S",
					role: "Code Break"
				},
				{
					id: "t-cb-2",
					name: "Habeeba N",
					role: "Code Break"
				},
				{
					id: "t-cc-1",
					name: "Kishore R",
					role: "Code Canvas"
				},
				{
					id: "t-cc-2",
					name: "Safa S",
					role: "Code Canvas"
				},
				{
					id: "t-nn-1",
					name: "Adithya K",
					role: "Neural Nexus"
				},
				{
					id: "t-nn-2",
					name: "Tamilarasi M",
					role: "Neural Nexus"
				},
				{
					id: "t-bb-1",
					name: "Santhosh V",
					role: "Binary Battle"
				},
				{
					id: "t-bb-2",
					name: "Ruba S",
					role: "Binary Battle"
				},
				{
					id: "t-gc-1",
					name: "Naveen P",
					role: "Game Craft"
				},
				{
					id: "t-gc-2",
					name: "Mariam F",
					role: "Game Craft"
				},
				{
					id: "t-tt-1",
					name: "Arun Kumar B",
					role: "Tech Talks"
				},
				{
					id: "t-tt-2",
					name: "Anisha R",
					role: "Tech Talks"
				},
				{
					id: "t-cy-1",
					name: "Irfan A",
					role: "Cyber Breach"
				},
				{
					id: "t-cy-2",
					name: "Nivetha S",
					role: "Cyber Breach"
				},
				{
					id: "t-pp-1",
					name: "Harish M",
					role: "Prompt Pop"
				},
				{
					id: "t-pp-2",
					name: "Fathima Z",
					role: "Prompt Pop"
				}
			]
		},
		{
			id: "nontechnical-coords",
			label: "Non-Technical Event Coordinators",
			members: [
				{
					id: "nt-sv-1",
					name: "Praveen R",
					role: "Shutter Verse"
				},
				{
					id: "nt-sv-2",
					name: "Ananya K",
					role: "Shutter Verse"
				},
				{
					id: "nt-cl-1",
					name: "Zain M",
					role: "Clue Code"
				},
				{
					id: "nt-cl-2",
					name: "Priya L",
					role: "Clue Code"
				},
				{
					id: "nt-tr-1",
					name: "Yuvaraj S",
					role: "Trashion"
				},
				{
					id: "nt-tr-2",
					name: "Sana B",
					role: "Trashion"
				},
				{
					id: "nt-vo-1",
					name: "Deepak N",
					role: "The Voice Over"
				},
				{
					id: "nt-vo-2",
					name: "Shalini V",
					role: "The Voice Over"
				},
				{
					id: "nt-bg-1",
					name: "Rahul J",
					role: "BGMI"
				},
				{
					id: "nt-bg-2",
					name: "Ismail A",
					role: "BGMI"
				},
				{
					id: "nt-fi-1",
					name: "Kavin M",
					role: "FIFA"
				},
				{
					id: "nt-fi-2",
					name: "Rithik S",
					role: "FIFA"
				},
				{
					id: "nt-va-1",
					name: "Pranav K",
					role: "Valorant"
				},
				{
					id: "nt-va-2",
					name: "Sathish R",
					role: "Valorant"
				},
				{
					id: "nt-bw-1",
					name: "Arafath M",
					role: "Bid Wars"
				},
				{
					id: "nt-bw-2",
					name: "Pooja D",
					role: "Bid Wars"
				}
			]
		}
	],
	socialLinks: [{
		label: "Instagram",
		handle: "@talent.hunt.2k26",
		url: "https://www.instagram.com/talent.hunt.2k26/"
	}],
	nav: [
		{
			to: "/",
			label: "Home"
		},
		{
			to: "/events/technical",
			label: "Technical Events"
		},
		{
			to: "/events/non-technical",
			label: "Non-Technical Events"
		},
		{
			to: "/schedule",
			label: "Schedule"
		},
		{
			to: "/coordinators",
			label: "Coordinators"
		},
		{
			to: "/about",
			label: "About"
		},
		{
			to: "/venue",
			label: "Venue"
		},
		{
			to: "/faqs",
			label: "FAQs"
		},
		{
			to: "/contact",
			label: "Contact"
		}
	],
	categories: {
		technical: {
			title: "Technical Events",
			short: "Technical",
			headline: "THINK IT.\nBUILD IT.",
			intro: "Eight competitions. One place to bring your technical talent to the foreground."
		},
		"non-technical": {
			title: "Non-Technical Events",
			short: "Non-Technical",
			headline: "BREAK THE\nEXPECTED.",
			intro: "Eight competitions. Explore the other side of Talent Hunt."
		}
	},
	copy: {
		heroEyebrow: "THE STAGE IS YOURS.",
		heroTagline: "Bring your ideas. Bring your edge. Bring you.",
		introHeading: "ONE CAMPUS.\nEVERY KIND\nOF TALENT.",
		intro: "From the technical to the unexpected, find your place at Talent Hunt 2K26. Explore sixteen competitions brought together by the Department of Computer Science and Engineering.",
		eventDetailsPending: "Explore the competition. Detailed rules and participation information will be shared by the organisers.",
		registrationPending: "Registration details have not yet been announced. Check back for the official form and registration window.",
		schedulePending: "The event date is confirmed. The detailed programme and timings will be announced by the organisers.",
		venuePending: "The brochure confirms the auditorium. Detailed campus directions have not yet been supplied.",
		about: "Talent Hunt 2K26 brings Technical and Non-Technical competitions together at Crescent. Presented by the Department of Computer Science and Engineering, under the School of Computer Information and Mathematical Sciences.",
		footerDescription: "Sixteen competitions. Your talent, in the spotlight.",
		privacy: [
			{
				title: "A public event website",
				text: "This website provides event information. It has no account system, contact-submission form, database, visitor analytics, advertising pixels or session-recording scripts. Fonts and artwork are served locally."
			},
			{
				title: "Registration & external links",
				text: "When registration is configured and open, the official Google Form handles submissions. This website does not submit or store student registration information or confirm a registration. Google and other external sites apply their own data practices when you follow a link."
			},
			{
				title: "Storage in your browser",
				text: "Session storage remembers whether the opening animation has played and keeps navigation scroll positions for this browser tab. Local storage remembers individual dismissed announcement IDs. Search and filter choices appear in the page URL. If browser storage is unavailable, the website continues to work with temporary in-memory state."
			},
			{
				title: "Sharing",
				text: "Copy Link writes the current page URL to your clipboard only when requested. Native Share opens your device’s share interface only when requested. No sharing data is sent to a website backend."
			}
		]
	},
	faqs: [
		{
			id: "eligibility",
			category: "Participation",
			question: "Who can participate?",
			answer: "Participation is restricted to Crescent students only. The official brochure specifies “ONLY FOR CSE,” so this site lists eligibility as Crescent CSE students."
		},
		{
			id: "date",
			category: "The event",
			question: "When is Talent Hunt 2K26?",
			answer: "Monday, 26 October 2026. The official start time has not yet been supplied."
		},
		{
			id: "venue",
			category: "The event",
			question: "Where is the event happening?",
			answer: "The auditorium at B.S. Abdur Rahman Crescent, as listed in the official brochure."
		},
		{
			id: "registration",
			category: "Participation",
			question: "How do I register?",
			answer: "Use the Registration page for availability. The official Google Form and QR code will appear there once the organisers supply and confirm the registration details."
		},
		{
			id: "rules",
			category: "Participation",
			question: "Where can I find competition rules?",
			answer: "Each competition has its own page. Verified rules and participation requirements will be added when supplied by the organisers."
		}
	],
	pages: {
		"/": {
			title: "Talent Hunt 2K26 — The stage is yours",
			description: "Explore 16 Technical and Non-Technical competitions at Crescent. Talent Hunt 2K26, Monday 26 October 2026. For Crescent CSE students only."
		},
		"/events/technical": {
			title: "Technical Events",
			description: "Explore the eight Technical competitions at Talent Hunt 2K26, in official brochure order."
		},
		"/events/non-technical": {
			title: "Non-Technical Events",
			description: "Explore the eight Non-Technical competitions at Talent Hunt 2K26, in official brochure order."
		},
		"/schedule": {
			title: "The Programme",
			description: "Confirmed event date and official programme information for Talent Hunt 2K26."
		},
		"/register": {
			title: "Take Your Place",
			description: "Registration availability and eligibility for Talent Hunt 2K26 at Crescent."
		},
		"/about": {
			title: "Made for Your Moment",
			description: "About Talent Hunt 2K26, presented by the Department of Computer Science and Engineering at Crescent."
		},
		"/venue": {
			title: "See You at Crescent",
			description: "Official venue information for Talent Hunt 2K26 at the Crescent auditorium."
		},
		"/faqs": {
			title: "Good Questions",
			description: "Verified answers about the date, venue, eligibility and registration for Talent Hunt 2K26."
		},
		"/coordinators": {
			title: "Coordinators",
			description: "Faculty and student coordinators for Talent Hunt 2K26 at Crescent."
		},
		"/contact": {
			title: "The People Behind It",
			description: "Verified organiser and convenor information for Talent Hunt 2K26."
		},
		"/privacy": {
			title: "Privacy & Your Data",
			description: "How this public event site uses browser storage, sharing and external registration links."
		},
		"/404": {
			title: "Page Not Found",
			description: "This page is outside the programme. Return to Talent Hunt 2K26.",
			noindex: true
		}
	}
};
//#endregion
//#region src/lib/content.ts
var localAssets = /* #__PURE__ */ Object.assign({
	"/public/assets/documents/brochure.jpg": "/assets/brochure-DYg9nCZ1.jpg",
	"/public/assets/logos/acm.png": "/assets/acm-BPO-Nj01.png",
	"/public/assets/logos/acm.webp": "/assets/acm-D1y0I4zd.webp",
	"/public/assets/logos/crescent.png": "/assets/crescent-CXjPYTax.png",
	"/public/assets/logos/csea.png": "/assets/csea-Cj8C_Yhb.png",
	"/public/assets/logos/talent-hunt.jpg": "/assets/talent-hunt-D2m9EU03.jpg",
	"/public/assets/logos/talent-hunt.png": "/assets/talent-hunt-DmesqptO.png"
});
var assetExists = (path) => !!path && Object.hasOwn(localAssets, `/public${path}`);
var safeUrl = (url) => {
	try {
		return !!url && new URL(url).protocol === "https:";
	} catch {
		return false;
	}
};
function isGoogleForm(url) {
	try {
		const u = new URL(url || "");
		return u.protocol === "https:" && !u.username && !u.password && (u.hostname === "docs.google.com" && u.pathname.startsWith("/forms/") || u.hostname === "forms.gle" && u.pathname.length > 1);
	} catch {
		return false;
	}
}
function validInstant(value, zone) {
	if (!value || !zone || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
	try {
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return false;
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: zone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hourCycle: "h23"
		}).formatToParts(date);
		const get = (name) => parts.find((p) => p.type === name)?.value;
		return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}` === value.slice(0, 19);
	} catch {
		return false;
	}
}
function registrationStatus(config, now, qrAvailable = assetExists(config.qr)) {
	if (!isGoogleForm(config.url) || !config.qrVerified || !qrAvailable || !validInstant(config.opensAt, config.timezone) || !validInstant(config.closesAt, config.timezone)) return "unconfigured";
	const start = Date.parse(config.opensAt);
	const end = Date.parse(config.closesAt);
	if (start >= end) return "unconfigured";
	return now < start ? "soon" : now >= end ? "closed" : "open";
}
function countdown(config, now) {
	if (!config.enabled || !validInstant(config.startsAt, config.timezone) || config.startsAt.slice(0, 10) !== siteData.settings.date) return null;
	const remaining = Math.max(0, Date.parse(config.startsAt) - now);
	const seconds = Math.floor(remaining / 1e3);
	return {
		remaining,
		days: Math.floor(seconds / 86400),
		hours: Math.floor(seconds / 3600) % 24,
		minutes: Math.floor(seconds / 60) % 60,
		seconds: seconds % 60
	};
}
function isArchived(now) {
	if (siteData.countdown.timezone) try {
		const p = new Intl.DateTimeFormat("en-CA", {
			timeZone: siteData.countdown.timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).formatToParts(now);
		const get = (t) => p.find((v) => v.type === t)?.value;
		return `${get("year")}-${get("month")}-${get("day")}` > siteData.settings.date;
	} catch {}
	return now >= Date.parse(`${siteData.settings.date}T23:59:59-12:00`) + 1e3;
}
var inCategory = (category, records = siteData.events) => records.filter((e) => e.category === category).sort((a, b) => a.order - b.order);
var filterEvents = (records, query, tag = "") => records.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()) && (!tag || e.tags.includes(tag)));
function neighbours(event) {
	const list = inCategory(event.category);
	const i = list.findIndex((e) => e.id === event.id);
	return {
		previous: list[i - 1],
		next: list[i + 1]
	};
}
function validateEvents(records) {
	const errors = [];
	const ids = /* @__PURE__ */ new Set();
	const slugs = /* @__PURE__ */ new Set();
	for (const e of records) {
		if (!e.id || typeof e.name !== "string" || !e.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.slug) || ["technical", "non-technical"].includes(e.slug)) errors.push(`Missing or invalid properties: ${e.id}`);
		if (ids.has(e.id)) errors.push(`Duplicate ID: ${e.id}`);
		if (slugs.has(e.slug)) errors.push(`Duplicate slug: ${e.slug}`);
		ids.add(e.id);
		slugs.add(e.slug);
		if (!["technical", "non-technical"].includes(e.category)) errors.push(`Invalid category: ${e.id}`);
		if (!Number.isInteger(e.order) || e.order < 1) errors.push(`Invalid order: ${e.id}`);
	}
	for (const cat of ["technical", "non-technical"]) if (inCategory(cat, records).some((e, i) => e.order !== i + 1)) errors.push(`Invalid category sequence: ${cat}`);
	for (const e of records) for (const id of e.relatedIds) if (!ids.has(id) || id === e.id) errors.push(`Invalid related reference: ${e.id}/${id}`);
	return errors;
}
function validateSiteData() {
	const errors = validateEvents(siteData.events);
	if (!siteData.settings.title || !siteData.settings.college || !siteData.settings.eligibility) errors.push("Missing required global content");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(siteData.settings.date)) errors.push("Invalid official date");
	const ids = /* @__PURE__ */ new Set();
	for (const a of siteData.announcements) {
		if (!a.id || !a.message || ids.has(a.id)) errors.push(`Missing or duplicate announcement: ${a.id}`);
		ids.add(a.id);
	}
	return errors;
}
var publicRoutes = [...Object.keys(siteData.pages).filter((p) => p !== "/404"), ...siteData.events.map((e) => `/events/${e.slug}`)];
function metadata(path) {
	const e = siteData.events.find((e) => `/events/${e.slug}` === path);
	const page = e ? {
		title: e.name,
		description: e.description || `${e.name} — ${siteData.categories[e.category].short} competition at Talent Hunt 2K26. ${siteData.settings.dateLabel}. ${siteData.settings.eligibility}.`,
		image: assetExists(e.socialImage) ? e.socialImage : void 0
	} : siteData.pages[path] || siteData.pages["/404"];
	return {
		...page,
		title: path === "/" ? page.title : `${page.title} | ${siteData.settings.title}`,
		image: page.image || (assetExists(siteData.assets.defaultSocial) ? siteData.assets.defaultSocial : void 0)
	};
}
//#endregion
//#region src/components/UI.tsx
function Arrow({ back = false }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		children: back ? "↙" : "↗"
	});
}
function Eyebrow({ children }) {
	return /* @__PURE__ */ jsxs("p", {
		className: "eyebrow",
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "signal"
		}), children]
	});
}
function SmartImage({ src, alt, fallback = null, ...props }) {
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [src]);
	return !src || failed || !assetExists(src) ? /* @__PURE__ */ jsx(Fragment, { children: fallback }) : /* @__PURE__ */ jsx("img", {
		...props,
		src,
		alt,
		onError: () => setFailed(true)
	});
}
function Reveal({ children, className = "" }) {
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsx(motion.div, {
		className,
		initial: false,
		whileInView: reduced ? {} : {
			y: [36, 0],
			opacity: [.6, 1]
		},
		viewport: {
			once: true,
			amount: .1
		},
		transition: {
			duration: .75,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		children
	});
}
function ButtonLink({ to, children, secondary = false }) {
	const ref = useRef(null);
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsxs(Link, {
		ref,
		className: `button ${secondary ? "button-secondary" : ""}`,
		to,
		onPointerMove: (e) => {
			if (e.pointerType !== "mouse" || reduced || !ref.current) return;
			const r = e.currentTarget.getBoundingClientRect();
			ref.current.style.translate = `${(e.clientX - r.left - r.width / 2) * .07}px ${(e.clientY - r.top - r.height / 2) * .1}px`;
		},
		onPointerLeave: () => {
			if (ref.current) ref.current.style.translate = "0 0";
		},
		children: [children, /* @__PURE__ */ jsx(Arrow, {})]
	});
}
function BrochureLink({ small = false }) {
	return assetExists(siteData.assets.brochurePdf) ? /* @__PURE__ */ jsxs("a", {
		className: small ? "text-link" : "button button-secondary",
		href: siteData.assets.brochurePdf,
		download: true,
		children: ["Download Brochure ", /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			children: "↓"
		})]
	}) : assetExists(siteData.assets.brochureImage) ? /* @__PURE__ */ jsxs("a", {
		className: small ? "text-link" : "button button-secondary",
		href: siteData.assets.brochureImage,
		target: "_blank",
		rel: "noopener noreferrer",
		children: ["View Official Brochure ", /* @__PURE__ */ jsx(Arrow, {})]
	}) : /* @__PURE__ */ jsx("span", {
		className: "muted",
		children: "Brochure download will be available when supplied."
	});
}
var drawings = [
	/* @__PURE__ */ jsx("path", { d: "m75 76-40 44 40 44m90-88 40 44-40 44m-26-104-35 120" }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("rect", {
		x: "32",
		y: "55",
		width: "176",
		height: "130",
		rx: "8"
	}), /* @__PURE__ */ jsx("path", { d: "M32 84h176M47 70h2m12 0h2m12 0h2M55 105h55v54H55zm72 2h58m-58 20h45m-45 20h58" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", { d: "m65 65 110 18-92 89 100-8M65 65l18 107m92-89 8 81M65 65l118 99M83 172l92-89" }), [
		[65, 65],
		[175, 83],
		[83, 172],
		[183, 164],
		[120, 118]
	].map(([x, y]) => /* @__PURE__ */ jsx("circle", {
		cx: x,
		cy: y,
		r: "13"
	}, x))] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("rect", {
			x: "65",
			y: "65",
			width: "110",
			height: "110",
			rx: "15"
		}),
		/* @__PURE__ */ jsx("rect", {
			x: "89",
			y: "89",
			width: "62",
			height: "62",
			rx: "3"
		}),
		[
			85,
			120,
			155
		].map((n) => /* @__PURE__ */ jsx("path", { d: `M${n} 40v25m0 110v25M40 ${n}h25m110 0h25` }, n))
	] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("path", { d: "M70 80h100c22 0 44 91 26 99-16 8-40-28-46-28H90c-6 0-30 36-46 28-18-8 4-99 26-99Z" }),
		/* @__PURE__ */ jsx("path", { d: "M69 105v38m-19-19h38" }),
		/* @__PURE__ */ jsx("circle", {
			cx: "163",
			cy: "113",
			r: "6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "178",
			cy: "135",
			r: "6"
		})
	] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("rect", {
		x: "94",
		y: "40",
		width: "52",
		height: "108",
		rx: "26"
	}), /* @__PURE__ */ jsx("path", { d: "M73 118a47 47 0 0 0 94 0m-47 47v35m-30 0h60M95 69h50m-50 21h50" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", { d: "m120 30 77 30v62c0 39-77 88-77 88s-77-49-77-88V60Z" }), /* @__PURE__ */ jsx("path", { d: "m86 119 24 24 47-48" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", { d: "m120 34 22 63 64 23-64 23-22 63-23-63-63-23 63-23Z" }), /* @__PURE__ */ jsx("path", { d: "m185 24 8 20 20 8-20 8-8 20-8-20-20-8 20-8Z" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("path", { d: "M38 78h45l13-23h48l13 23h45v105H38Z" }),
		/* @__PURE__ */ jsx("circle", {
			cx: "120",
			cy: "128",
			r: "34"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "120",
			cy: "128",
			r: "19"
		}),
		/* @__PURE__ */ jsx("path", { d: "M166 96h20" })
	] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("circle", {
		cx: "100",
		cy: "100",
		r: "60"
	}), /* @__PURE__ */ jsx("path", { d: "m143 143 60 60M85 80c5-20 35-20 35 0 0 14-20 14-20 30m0 14v3" })] }),
	/* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("path", { d: "M101 72c0-26 38-26 38-3 0 13-19 15-19 29v16l84 53c10 7 2 16-9 16H45c-11 0-19-9-9-16l84-53" }) }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("rect", {
		x: "30",
		y: "59",
		width: "180",
		height: "122",
		rx: "30"
	}), /* @__PURE__ */ jsx("path", { d: "m101 91 49 30-49 30Z" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", { d: "M45 141v-23a75 75 0 0 1 150 0v39H85l-22 32-20-18 20-29m42-64h70m-78 48h103" }), /* @__PURE__ */ jsx("path", { d: "M120 42v35" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("circle", {
		cx: "120",
		cy: "120",
		r: "85"
	}), /* @__PURE__ */ jsx("path", { d: "m120 87 34 25-13 40H99l-13-40Zm0 0V35m34 77 47-21m-60 61 26 40m-68-40-26 40m13-80L39 91" })] }),
	/* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", { d: "m33 65 87 108 87-108M33 105l87 108 87-108" }), /* @__PURE__ */ jsx("path", { d: "m83 46 37 46 37-46" })] }),
	/* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("path", { d: "m86 42 64 64-32 32-64-64Zm33 95 67 67m-59-163 46 46M44 81l46 46M37 199h75v13H37Z" }) })
];
function EventArt({ event, hero = false, shared = true }) {
	const reduced = useReducedMotion();
	const i = siteData.events.findIndex((e) => e.id === event.id);
	return /* @__PURE__ */ jsxs(motion.div, {
		layoutId: reduced || !shared ? void 0 : `art-${event.id}`,
		transition: { layout: {
			duration: .65,
			ease: [
				.22,
				1,
				.36,
				1
			]
		} },
		className: `event-art art-${i % 4} ${event.category === "non-technical" ? "art-orange" : ""} ${hero ? "art-hero" : ""}`,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("span", { className: "art-grid" }),
			/* @__PURE__ */ jsx("span", { className: "art-light" }),
			/* @__PURE__ */ jsx("span", { className: "art-sculpture" }),
			/* @__PURE__ */ jsx("span", { className: "art-orbit" }),
			/* @__PURE__ */ jsx("span", { className: "art-orbit art-orbit-second" }),
			/* @__PURE__ */ jsx("span", {
				className: "art-type",
				children: event.name
			}),
			/* @__PURE__ */ jsx("span", {
				className: "art-number",
				children: String(event.order).padStart(2, "0")
			}),
			event.artwork && assetExists(event.artwork) ? /* @__PURE__ */ jsx(SmartImage, {
				src: event.artwork,
				alt: ""
			}) : /* @__PURE__ */ jsx("svg", {
				viewBox: "0 0 240 240",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: drawings[i] || drawings[0]
			}),
			/* @__PURE__ */ jsxs("span", {
				className: "art-caption",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "art-crosshair",
						children: "+"
					}),
					" TH / 26",
					" ",
					/* @__PURE__ */ jsx("span", { className: "art-barcode" })
				]
			})
		]
	});
}
function EventCard({ event }) {
	const reduced = useReducedMotion();
	const reset = (element) => {
		element.style.setProperty("--tilt-x", "0deg");
		element.style.setProperty("--tilt-y", "0deg");
	};
	return /* @__PURE__ */ jsx(motion.article, {
		layout: !reduced,
		initial: false,
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		whileInView: reduced ? {} : {
			y: [36, 0],
			opacity: [.65, 1]
		},
		viewport: {
			once: true,
			amount: .12
		},
		transition: {
			duration: .65,
			delay: (event.order - 1) % 3 * .08,
			ease: [
				.16,
				1,
				.3,
				1
			],
			layout: { duration: .35 }
		},
		className: `event-card ${event.category === "non-technical" ? "card-orange" : ""}`,
		style: { "--card-order": (event.order - 1) % 3 },
		children: /* @__PURE__ */ jsxs(Link, {
			to: `/events/${event.slug}`,
			"aria-label": `Explore ${event.name}`,
			onPointerMove: (e) => {
				if (reduced || e.pointerType !== "mouse") return;
				const r = e.currentTarget.getBoundingClientRect();
				const x = (e.clientX - r.left) / r.width;
				const y = (e.clientY - r.top) / r.height;
				e.currentTarget.style.setProperty("--tilt-x", `${(.5 - y) * 8}deg`);
				e.currentTarget.style.setProperty("--tilt-y", `${(x - .5) * 8}deg`);
				e.currentTarget.style.setProperty("--pointer-x", `${x * 100}%`);
				e.currentTarget.style.setProperty("--pointer-y", `${y * 100}%`);
			},
			onPointerLeave: (e) => reset(e.currentTarget),
			onBlur: (e) => reset(e.currentTarget),
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "card-topline",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "card-category",
						children: [/* @__PURE__ */ jsx("span", { className: "card-category-dot" }), siteData.categories[event.category].short]
					}), /* @__PURE__ */ jsx("span", {
						className: "card-edition",
						children: /* @__PURE__ */ jsxs("span", {
							className: "card-edition-num",
							children: ["#0", event.order]
						})
					})]
				}),
				/* @__PURE__ */ jsx(EventArt, { event }),
				/* @__PURE__ */ jsxs("div", {
					className: "card-copy",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "card-badges-row",
							children: [/* @__PURE__ */ jsx("span", {
								className: "card-chip",
								children: "2026 EDITION"
							}), /* @__PURE__ */ jsx("span", {
								className: "card-chip",
								children: event.category === "technical" ? "TECH ARENA" : "OPEN ARENA"
							})]
						}),
						/* @__PURE__ */ jsx(motion.h3, {
							layoutId: reduced ? void 0 : `title-${event.id}`,
							children: event.name
						}),
						event.description && /* @__PURE__ */ jsx("p", { children: event.description }),
						/* @__PURE__ */ jsxs("span", {
							className: "card-action",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "card-action-label",
								children: [/* @__PURE__ */ jsx("span", { children: "Explore Event" }), /* @__PURE__ */ jsx("span", {
									className: "card-action-sub",
									children: "Brochure Official"
								})]
							}), /* @__PURE__ */ jsx("span", {
								className: "card-arrow",
								children: /* @__PURE__ */ jsx(Arrow, {})
							})]
						})
					]
				})
			]
		})
	});
}
function EventGrid({ events }) {
	return /* @__PURE__ */ jsx("div", {
		className: "event-grid",
		children: /* @__PURE__ */ jsx(AnimatePresence, {
			initial: false,
			children: events.map((e) => /* @__PURE__ */ jsx(EventCard, { event: e }, e.id))
		})
	});
}
function Accordion({ faq }) {
	const [open, setOpen] = useState(false);
	const id = useId();
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsxs("div", {
		className: "accordion",
		children: [/* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsxs("button", {
			"aria-expanded": open,
			"aria-controls": id,
			onClick: () => setOpen(!open),
			children: [faq.question, /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				children: open ? "−" : "+"
			})]
		}) }), /* @__PURE__ */ jsx(motion.div, {
			id,
			hidden: !open,
			initial: false,
			animate: {
				height: open ? "auto" : 0,
				opacity: open ? 1 : 0
			},
			transition: { duration: reduced ? 0 : .25 },
			children: /* @__PURE__ */ jsx("p", { children: faq.answer })
		})]
	});
}
function CoordinatorCard({ person }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "person",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "micro",
				children: person.role
			}),
			/* @__PURE__ */ jsx("h3", { children: person.name }),
			person.phone && /^\+?[\d ()-]{7,20}$/.test(person.phone) && /* @__PURE__ */ jsx("a", {
				href: `tel:${person.phone.replace(/[ ()-]/g, "")}`,
				children: person.phone
			}),
			person.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) && /* @__PURE__ */ jsx("a", {
				href: `mailto:${person.email}`,
				children: person.email
			}),
			safeUrl(person.url) && /* @__PURE__ */ jsxs("a", {
				href: person.url,
				target: "_blank",
				rel: "noopener noreferrer",
				children: ["Contact ", /* @__PURE__ */ jsx(Arrow, {})]
			})
		]
	});
}
var dismissedMemory = /* @__PURE__ */ new Set();
function AnnouncementBanner({ announcement }) {
	const [dismissed, setDismissed] = useState(true);
	useEffect(() => {
		let value = dismissedMemory.has(announcement.id);
		try {
			value ||= localStorage.getItem(`th26:announcement:${announcement.id}`) === "dismissed";
		} catch {}
		setDismissed(value);
	}, [announcement.id]);
	if (dismissed) return null;
	return /* @__PURE__ */ jsxs("aside", {
		className: "announcement",
		children: [/* @__PURE__ */ jsxs("p", { children: [
			announcement.message,
			" ",
			safeUrl(announcement.url) && /* @__PURE__ */ jsx("a", {
				href: announcement.url,
				target: "_blank",
				rel: "noopener noreferrer",
				children: "Read more ↗"
			})
		] }), /* @__PURE__ */ jsx("button", {
			"aria-label": "Dismiss announcement",
			onClick: () => {
				dismissedMemory.add(announcement.id);
				try {
					localStorage.setItem(`th26:announcement:${announcement.id}`, "dismissed");
				} catch {}
				setDismissed(true);
			},
			children: "×"
		})]
	});
}
function ShareActions() {
	const [message, setMessage] = useState("");
	const [canShare, setCanShare] = useState(false);
	useEffect(() => setCanShare(typeof navigator.share === "function"), []);
	async function copy() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setMessage("Link copied.");
		} catch {
			setMessage("Copy was unavailable. Select and copy the link below.");
		}
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "share",
		children: [
			/* @__PURE__ */ jsx("button", {
				className: "text-link",
				onClick: copy,
				children: "Copy Link ↗"
			}),
			canShare && /* @__PURE__ */ jsx("button", {
				className: "text-link",
				onClick: async () => {
					try {
						await navigator.share({
							title: document.title,
							url: window.location.href
						});
						setMessage("Share dialog completed.");
					} catch (e) {
						setMessage(e instanceof Error && e.name === "AbortError" ? "Sharing cancelled." : "Sharing unavailable. Use Copy Link.");
					}
				},
				children: "Share ↗"
			}),
			/* @__PURE__ */ jsx("span", {
				role: "status",
				children: message
			}),
			message.startsWith("Copy was") && /* @__PURE__ */ jsx("input", {
				"aria-label": "Page link",
				readOnly: true,
				value: window.location.href,
				onFocus: (e) => e.target.select()
			})
		]
	});
}
var ErrorBoundary = class extends Component {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error, info) {}
	render() {
		return this.state.failed ? /* @__PURE__ */ jsxs("main", {
			className: "error-screen",
			children: [
				/* @__PURE__ */ jsx(Eyebrow, { children: "TALENT HUNT 2K26" }),
				/* @__PURE__ */ jsxs("h1", { children: [
					"LET’S RESET",
					/* @__PURE__ */ jsx("br", {}),
					"THE STAGE."
				] }),
				/* @__PURE__ */ jsx("p", { children: "Something interrupted this page. Please try again." }),
				/* @__PURE__ */ jsx("button", {
					className: "button",
					onClick: () => this.setState({ failed: false }),
					children: "Try Again"
				}),
				/* @__PURE__ */ jsx("a", {
					className: "button button-secondary",
					href: "/",
					children: "Return Home"
				})
			]
		}) : this.props.children;
	}
};
//#endregion
//#region src/components/Layout.tsx
function Header() {
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const dialog = useRef(null);
	const toggle = useRef(null);
	const location = useLocation();
	useEffect(() => {
		setOpen(false);
	}, [location.pathname]);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	useEffect(() => {
		if (open) {
			dialog.current?.showModal();
			document.body.style.overflow = "hidden";
		} else {
			dialog.current?.close();
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);
	const close = () => {
		setOpen(false);
		toggle.current?.focus();
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("a", {
			href: "#main",
			className: "skip-link",
			children: "Skip to content"
		}),
		/* @__PURE__ */ jsxs("header", {
			className: `site-header ${scrolled ? "scrolled" : ""}`,
			children: [
				/* @__PURE__ */ jsxs(Link, {
					to: "/",
					className: "brand",
					"aria-label": "Talent Hunt 2K26 home",
					children: [/* @__PURE__ */ jsx(SmartImage, {
						src: siteData.assets.event,
						alt: "",
						width: "44",
						height: "44"
					}), /* @__PURE__ */ jsxs("span", { children: ["TALENT HUNT", /* @__PURE__ */ jsx("small", { children: "2K26 / CRESCENT" })] })]
				}),
				/* @__PURE__ */ jsx("nav", {
					className: "desktop-nav",
					"aria-label": "Main navigation",
					children: siteData.nav.map((n) => /* @__PURE__ */ jsx(NavLink, {
						end: n.to === "/",
						to: n.to,
						children: n.label
					}, n.to))
				}),
				/* @__PURE__ */ jsxs(Link, {
					to: "/register",
					className: "nav-register",
					children: ["Register ", /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "↗"
					})]
				}),
				/* @__PURE__ */ jsxs("button", {
					ref: toggle,
					className: "menu-toggle",
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					"aria-controls": "mobile-menu",
					onClick: () => setOpen(true),
					children: ["Menu ", /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "☰"
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("dialog", {
			ref: dialog,
			id: "mobile-menu",
			className: "mobile-menu",
			"aria-labelledby": "menu-heading",
			onCancel: () => setOpen(false),
			onClose: () => setOpen(false),
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "menu-top",
					children: [/* @__PURE__ */ jsx("span", {
						id: "menu-heading",
						className: "eyebrow",
						children: "FIND YOUR MOMENT"
					}), /* @__PURE__ */ jsx("button", {
						autoFocus: true,
						onClick: close,
						children: "Close ×"
					})]
				}),
				/* @__PURE__ */ jsx("nav", {
					"aria-label": "Mobile navigation",
					children: [...siteData.nav, {
						to: "/register",
						label: "Register"
					}].map((n, i) => /* @__PURE__ */ jsxs(Link, {
						to: n.to,
						onClick: close,
						style: { animationDelay: `${i * 35}ms` },
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "micro",
								children: ["0", i + 1]
							}),
							n.label,
							/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								children: "↗"
							})
						]
					}, n.to))
				}),
				/* @__PURE__ */ jsx("p", { children: siteData.settings.eligibility })
			]
		})
	] });
}
function Footer() {
	return /* @__PURE__ */ jsxs("footer", {
		className: "site-footer",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "footer-top",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "eyebrow",
							children: "YOUR TALENT. YOUR MOMENT."
						}),
						/* @__PURE__ */ jsxs(Link, {
							to: "/",
							className: "footer-wordmark",
							children: ["TALENT HUNT", /* @__PURE__ */ jsx("span", { children: "2K26" })]
						}),
						/* @__PURE__ */ jsx("p", { children: siteData.copy.footerDescription })
					] }),
					/* @__PURE__ */ jsxs("div", {
						className: "footer-nav",
						children: [/* @__PURE__ */ jsx("h2", { children: "Explore" }), siteData.nav.slice(1).map((n) => /* @__PURE__ */ jsx(Link, {
							to: n.to,
							children: n.label
						}, n.to))]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "footer-connect",
						children: [
							/* @__PURE__ */ jsx("h2", { children: "Stay connected" }),
							siteData.socialLinks.map((s) => /* @__PURE__ */ jsxs("a", {
								href: s.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: [s.handle, " ↗"]
							}, s.url)),
							/* @__PURE__ */ jsx(BrochureLink, { small: true }),
							/* @__PURE__ */ jsx(Link, {
								to: "/register",
								children: "Registration ↗"
							}),
							/* @__PURE__ */ jsx(Link, {
								to: "/privacy",
								children: "Privacy & your data"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "footer-logos",
				children: [
					/* @__PURE__ */ jsx(SmartImage, {
						className: "college-logo",
						src: siteData.assets.college,
						alt: siteData.settings.college,
						width: "240",
						height: "67",
						loading: "lazy"
					}),
					/* @__PURE__ */ jsx(SmartImage, {
						src: siteData.assets.csea,
						alt: "CSEA",
						width: "70",
						height: "64",
						loading: "lazy"
					}),
					/* @__PURE__ */ jsx(SmartImage, {
						src: siteData.assets.acm,
						alt: "ACM",
						width: "57",
						height: "57",
						loading: "lazy"
					}),
					/* @__PURE__ */ jsxs("p", { children: [
						siteData.settings.school,
						/* @__PURE__ */ jsx("br", {}),
						siteData.settings.department
					] })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "footer-bottom",
				children: [/* @__PURE__ */ jsx("span", { children: siteData.settings.copyright }), /* @__PURE__ */ jsxs("span", { children: [
					siteData.settings.eligibility,
					" ",
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "↗"
					})
				] })]
			})
		]
	});
}
var scrollMemory = /* @__PURE__ */ new Map();
function NavigationEffects() {
	const location = useLocation();
	const type = useNavigationType();
	const previous = useRef(location.pathname);
	useEffect(() => {
		const m = metadata(location.pathname);
		document.title = m.title;
		for (const [key, value, property] of [
			[
				"description",
				m.description,
				false
			],
			[
				"og:title",
				m.title,
				true
			],
			[
				"og:description",
				m.description,
				true
			],
			[
				"twitter:title",
				m.title,
				false
			],
			[
				"twitter:description",
				m.description,
				false
			]
		]) {
			let el = document.head.querySelector(`meta[${property ? "property" : "name"}="${key}"]`);
			if (!el) {
				el = document.createElement("meta");
				el.setAttribute(property ? "property" : "name", key);
				document.head.appendChild(el);
			}
			el.content = value;
		}
		for (const key of ["og:image", "twitter:image"]) {
			document.head.querySelector(`meta[${key === "og:image" ? "property" : "name"}="${key}"]`)?.remove();
			if (m.image) {
				const el = document.createElement("meta");
				el.setAttribute(key === "og:image" ? "property" : "name", key);
				el.content = siteData.settings.productionUrl ? new URL(m.image, siteData.settings.productionUrl).href : m.image;
				document.head.appendChild(el);
			}
		}
		document.head.querySelector("meta[name=\"robots\"]")?.remove();
		if (m.noindex) {
			const el = document.createElement("meta");
			el.name = "robots";
			el.content = "noindex";
			document.head.appendChild(el);
		}
		document.head.querySelector("link[rel=\"canonical\"]")?.remove();
		document.head.querySelector("meta[property=\"og:url\"]")?.remove();
		if (siteData.settings.productionUrl && !m.noindex) {
			const el = document.createElement("link");
			el.rel = "canonical";
			el.href = new URL(location.pathname, siteData.settings.productionUrl).href;
			document.head.appendChild(el);
			const og = document.createElement("meta");
			og.setAttribute("property", "og:url");
			og.content = el.href;
			document.head.appendChild(og);
		}
	}, [location.pathname]);
	useEffect(() => {
		history.scrollRestoration = "manual";
		const storageKey = location.pathname + location.search + "|" + location.key;
		const save = () => {
			scrollMemory.set(storageKey, window.scrollY);
			try {
				sessionStorage.setItem(`th26:scroll:${storageKey}`, String(window.scrollY));
			} catch {}
		};
		let y = scrollMemory.get(storageKey) || 0;
		try {
			y = Number(sessionStorage.getItem(`th26:scroll:${storageKey}`)) || y;
		} catch {}
		const id = requestAnimationFrame(() => {
			if (type === "POP") window.scrollTo(0, y);
			else if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
			else if (previous.current !== location.pathname) window.scrollTo(0, 0);
			if (previous.current !== location.pathname) {
				document.getElementById("main")?.focus({ preventScroll: true });
				previous.current = location.pathname;
			}
		});
		window.addEventListener("scroll", save, { passive: true });
		return () => {
			cancelAnimationFrame(id);
			window.removeEventListener("scroll", save);
		};
	}, [
		location.key,
		location.pathname,
		location.search,
		location.hash,
		type
	]);
	return null;
}
var introSeen = false;
function Intro() {
	const reduced = useReducedMotion();
	const [visible, setVisible] = useState(false);
	const [sound, setSound] = useState(false);
	const audio = useRef(null);
	useEffect(() => {
		let seen = introSeen;
		try {
			seen ||= sessionStorage.getItem("th26:intro") === "seen";
		} catch {}
		if (!seen && !reduced) {
			setVisible(true);
			introSeen = true;
			try {
				sessionStorage.setItem("th26:intro", "seen");
			} catch {}
		}
	}, [reduced]);
	useEffect(() => {
		if (!visible) return;
		const timer = window.setTimeout(() => {
			setVisible(false);
			audio.current?.pause();
		}, 2800);
		return () => clearTimeout(timer);
	}, [visible]);
	if (!visible || reduced) return null;
	return /* @__PURE__ */ jsxs("aside", {
		className: "intro",
		"aria-label": "Opening animation",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "intro-controls",
				children: [/* @__PURE__ */ jsx("button", {
					onClick: () => {
						setVisible(false);
						audio.current?.pause();
					},
					children: "Skip ↗"
				}), assetExists(siteData.assets.introAudio) && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("audio", {
					ref: audio,
					src: siteData.assets.introAudio
				}), /* @__PURE__ */ jsx("button", {
					"aria-pressed": sound,
					onClick: async () => {
						if (sound) {
							audio.current?.pause();
							setSound(false);
						} else try {
							await audio.current?.play();
							setSound(true);
						} catch {
							setSound(false);
						}
					},
					children: sound ? "Mute" : "Sound"
				})] })]
			}),
			/* @__PURE__ */ jsx(motion.div, {
				className: "intro-logo-wrap",
				initial: {
					opacity: 0,
					scale: .55
				},
				animate: {
					opacity: 1,
					scale: 1
				},
				transition: {
					duration: .75,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				children: /* @__PURE__ */ jsx(SmartImage, {
					src: siteData.assets.event,
					alt: "Talent Hunt 2K26",
					width: "220",
					height: "220",
					className: "intro-logo-img"
				})
			}),
			/* @__PURE__ */ jsxs(motion.div, {
				className: "intro-wordmark",
				initial: {
					opacity: 0,
					y: 24
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					duration: .7,
					delay: .45,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				children: [/* @__PURE__ */ jsx("span", {
					className: "intro-title",
					children: "TALENT HUNT"
				}), /* @__PURE__ */ jsx("span", {
					className: "intro-year",
					children: "2K26"
				})]
			}),
			/* @__PURE__ */ jsx(motion.p, {
				className: "intro-tagline",
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: {
					duration: .6,
					delay: .85
				},
				children: "YOUR TALENT. OUR STAGE."
			}),
			/* @__PURE__ */ jsx("div", {
				className: "intro-particles",
				"aria-hidden": "true",
				children: [...Array(12)].map((_, i) => /* @__PURE__ */ jsx("span", {
					className: "intro-particle",
					style: { "--pi": i }
				}, i))
			})
		]
	});
}
//#endregion
//#region src/pages/Pages.tsx
function useNow() {
	const [now, setNow] = useState(null);
	useEffect(() => {
		setNow(Date.now());
		const timer = window.setInterval(() => setNow(Date.now()), 1e3);
		return () => clearInterval(timer);
	}, []);
	return now;
}
function DateStrip() {
	const now = useNow();
	const value = now === null ? null : countdown(siteData.countdown, now);
	return /* @__PURE__ */ jsxs("section", {
		className: "date-strip",
		"aria-label": "Event date",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "date-block",
				children: [/* @__PURE__ */ jsx("span", {
					className: "date-number",
					children: "26"
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: "OCTOBER 2026" }), /* @__PURE__ */ jsx("span", { children: "MONDAY" })] })]
			}),
			now !== null && isArchived(now) ? /* @__PURE__ */ jsx("p", { children: siteData.settings.archiveMessage }) : value ? value.remaining > 0 ? /* @__PURE__ */ jsx("div", {
				className: "countdown",
				"aria-label": "Time until event",
				children: [
					"days",
					"hours",
					"minutes",
					"seconds"
				].map((key) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(motion.strong, {
					initial: false,
					animate: { opacity: 1 },
					children: String(value[key]).padStart(2, "0")
				}, value[key]), /* @__PURE__ */ jsx("span", { children: key })] }, key))
			}) : /* @__PURE__ */ jsx("p", { children: siteData.settings.eventConcludedMessage }) : /* @__PURE__ */ jsxs("div", {
				className: "date-message",
				children: [/* @__PURE__ */ jsx("span", {
					className: "micro",
					children: "MARK YOUR CALENDAR"
				}), /* @__PURE__ */ jsx("p", { children: "The date is set. Your moment is next." })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "date-venue",
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: "↗"
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: "AUDITORIUM" }), /* @__PURE__ */ jsx("span", { children: "B.S. Abdur Rahman Crescent" })] })]
			})
		]
	});
}
function SectionHeading({ number, title, link, label }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "section-heading",
		children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
			className: "eyebrow",
			children: [number, " / FIND YOUR ARENA"]
		}), /* @__PURE__ */ jsx("h2", { children: title })] }), link && /* @__PURE__ */ jsxs(Link, {
			className: "text-link",
			to: link,
			children: [
				label || "View all events",
				" ",
				/* @__PURE__ */ jsx(Arrow, {})
			]
		})]
	});
}
function Featured() {
	const list = siteData.featuredIds.map((id) => siteData.events.find((e) => e.id === id)).filter((e) => !!e);
	const [index, setIndex] = useState(0);
	const [hover, setHover] = useState(false);
	const [focus, setFocus] = useState(false);
	const [paused, setPaused] = useState(false);
	const reduced = useReducedMotion();
	useEffect(() => {
		if (list.length < 2 || hover || focus || paused || reduced) return;
		const timer = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 5500);
		return () => clearInterval(timer);
	}, [
		list.length,
		hover,
		focus,
		paused,
		reduced
	]);
	if (!list.length) return null;
	const event = list[index % list.length];
	return /* @__PURE__ */ jsxs("section", {
		className: "featured",
		"aria-roledescription": "carousel",
		"aria-label": "Featured events",
		onMouseEnter: () => setHover(true),
		onMouseLeave: () => setHover(false),
		onFocus: () => setFocus(true),
		onBlur: (e) => {
			if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
		},
		children: [/* @__PURE__ */ jsxs("div", {
			className: "featured-copy",
			children: [
				/* @__PURE__ */ jsx(Eyebrow, { children: "IN THE SPOTLIGHT" }),
				/* @__PURE__ */ jsxs("h2", { children: [
					"FIND YOUR",
					/* @__PURE__ */ jsx("br", {}),
					/* @__PURE__ */ jsx("em", { children: "MAIN EVENT." })
				] }),
				/* @__PURE__ */ jsxs("div", {
					className: "carousel-controls",
					children: [
						/* @__PURE__ */ jsx("button", {
							"aria-label": "Previous featured event",
							onClick: () => setIndex((i) => (i - 1 + list.length) % list.length),
							children: "←"
						}),
						/* @__PURE__ */ jsxs("span", { children: [
							String(index + 1).padStart(2, "0"),
							" /",
							" ",
							String(list.length).padStart(2, "0")
						] }),
						/* @__PURE__ */ jsx("button", {
							"aria-label": "Next featured event",
							onClick: () => setIndex((i) => (i + 1) % list.length),
							children: "→"
						}),
						/* @__PURE__ */ jsx("button", {
							className: "carousel-pause",
							"aria-pressed": paused,
							onClick: () => setPaused(!paused),
							children: paused ? "Play" : "Pause"
						})
					]
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "featured-event",
			"aria-live": paused || hover || focus ? "polite" : "off",
			children: /* @__PURE__ */ jsx(AnimatePresence, {
				mode: "wait",
				initial: false,
				children: /* @__PURE__ */ jsx(motion.div, {
					initial: {
						opacity: reduced ? 1 : 0,
						x: reduced ? 0 : 45
					},
					animate: {
						opacity: 1,
						x: 0
					},
					exit: {
						opacity: reduced ? 1 : 0,
						x: reduced ? 0 : -35
					},
					transition: {
						duration: .4,
						ease: [
							.22,
							1,
							.36,
							1
						]
					},
					children: /* @__PURE__ */ jsxs(Link, {
						to: `/events/${event.slug}`,
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "featured-art",
								children: /* @__PURE__ */ jsx(EventArt, {
									event,
									shared: false
								})
							}),
							/* @__PURE__ */ jsx("span", {
								className: "micro",
								children: siteData.categories[event.category].short
							}),
							/* @__PURE__ */ jsxs("h3", { children: [event.name, /* @__PURE__ */ jsx(Arrow, {})] })
						]
					})
				}, event.id)
			})
		})]
	});
}
function ScheduleContent({ preview = false }) {
	const entries = preview ? siteData.schedule.slice(0, 3) : siteData.schedule;
	return /* @__PURE__ */ jsx("div", {
		className: "timeline",
		children: entries.length ? entries.filter((e) => e.time && e.title).map((e) => /* @__PURE__ */ jsxs(Reveal, {
			className: "timeline-row",
			children: [
				/* @__PURE__ */ jsx("span", { className: "timeline-dot" }),
				/* @__PURE__ */ jsx("time", { children: e.time }),
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("h3", { children: e.title }),
					e.description && /* @__PURE__ */ jsx("p", { children: e.description }),
					e.eventId && siteData.events.find((v) => v.id === e.eventId) && /* @__PURE__ */ jsx(Link, {
						className: "text-link",
						to: `/events/${siteData.events.find((v) => v.id === e.eventId).slug}`,
						children: "Explore Event ↗"
					})
				] })
			]
		}, e.id)) : /* @__PURE__ */ jsxs("div", {
			className: "timeline-row",
			children: [
				/* @__PURE__ */ jsx("span", { className: "timeline-dot" }),
				/* @__PURE__ */ jsxs("div", {
					className: "timeline-date",
					children: [/* @__PURE__ */ jsx("strong", { children: "26 OCT" }), /* @__PURE__ */ jsx("span", { children: "MONDAY / 2026" })]
				}),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "A day for your talent." }), /* @__PURE__ */ jsx("p", { children: siteData.copy.schedulePending })] })
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(Intro, {}),
		siteData.announcements.map((a) => /* @__PURE__ */ jsx(AnnouncementBanner, { announcement: a }, a.id)),
		/* @__PURE__ */ jsxs("section", {
			className: "hero",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "hero-top",
					children: [/* @__PURE__ */ jsxs("p", { children: [
						siteData.settings.school,
						/* @__PURE__ */ jsx("br", {}),
						/* @__PURE__ */ jsx("strong", { children: siteData.settings.department })
					] }), /* @__PURE__ */ jsx(SmartImage, {
						src: siteData.assets.college,
						alt: siteData.settings.college,
						className: "college-logo",
						width: "220",
						height: "61"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "hero-body",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "hero-copy",
						children: [
							/* @__PURE__ */ jsx(Eyebrow, { children: siteData.copy.heroEyebrow }),
							/* @__PURE__ */ jsxs("h1", { children: [/* @__PURE__ */ jsx("span", { children: "TALENT" }), /* @__PURE__ */ jsxs("span", {
								className: "hero-hunt",
								children: ["HUNT", /* @__PURE__ */ jsx("span", {
									className: "year",
									children: "2K26"
								})]
							})] }),
							/* @__PURE__ */ jsx("p", {
								className: "hero-tagline",
								children: siteData.copy.heroTagline
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "button-row",
								children: [/* @__PURE__ */ jsx(ButtonLink, {
									to: "/#competitions",
									children: "Explore Events"
								}), /* @__PURE__ */ jsx(ButtonLink, {
									to: "/register",
									secondary: true,
									children: "Register Now"
								})]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "eligibility",
								children: [
									/* @__PURE__ */ jsx("span", {
										"aria-hidden": "true",
										children: "◈"
									}),
									" ",
									siteData.settings.eligibility
								]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "hero-poster",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "poster-top",
								children: [/* @__PURE__ */ jsx("span", {
									className: "micro",
									children: "THE OFFICIAL DROP"
								}), /* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									children: "↘"
								})]
							}),
							/* @__PURE__ */ jsx("a", {
								href: siteData.assets.brochureImage,
								target: "_blank",
								rel: "noopener noreferrer",
								"aria-label": "View the official Talent Hunt brochure",
								children: /* @__PURE__ */ jsx(SmartImage, {
									src: siteData.assets.brochureImage,
									alt: "Official Talent Hunt 2K26 brochure",
									width: "1024",
									height: "1536",
									fetchPriority: "high"
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "poster-stamp",
								children: [/* @__PURE__ */ jsx("span", { children: "16 EVENTS" }), /* @__PURE__ */ jsx("span", { children: "ONE STAGE ↗" })]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "poster-side",
								"aria-hidden": "true",
								children: "CREATE / COMPETE / EXPRESS"
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "hero-bottom",
					children: [/* @__PURE__ */ jsx("span", { children: "TECHNICAL × NON-TECHNICAL" }), /* @__PURE__ */ jsxs("a", {
						href: "#competitions",
						children: ["SCROLL TO EXPLORE ", /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "↓"
						})]
					})]
				})
			]
		}),
		/* @__PURE__ */ jsx(DateStrip, {}),
		/* @__PURE__ */ jsxs("section", {
			className: "section intro-section",
			children: [/* @__PURE__ */ jsxs(Reveal, { children: [/* @__PURE__ */ jsx(Eyebrow, { children: "NOT JUST ANOTHER DAY ON CAMPUS" }), /* @__PURE__ */ jsx("h2", { children: siteData.copy.introHeading })] }), /* @__PURE__ */ jsxs(Reveal, {
				className: "intro-description",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "big-asterisk",
						"aria-hidden": "true",
						children: "✳"
					}),
					/* @__PURE__ */ jsx("p", { children: siteData.copy.intro }),
					/* @__PURE__ */ jsx(BrochureLink, {})
				]
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "ticker",
			"aria-hidden": "true",
			children: /* @__PURE__ */ jsx("span", { children: "THINK. CREATE. COMPETE. REPEAT. ↗ THINK. CREATE. COMPETE. REPEAT. ↗" })
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "section",
			id: "competitions",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				number: "01",
				title: "TECHNICAL.",
				link: "/events/technical"
			}), /* @__PURE__ */ jsx(EventGrid, { events: inCategory("technical") })]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "section nontechnical-section",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				number: "02",
				title: "BEYOND THE CODE.",
				link: "/events/non-technical"
			}), /* @__PURE__ */ jsx(EventGrid, { events: inCategory("non-technical") })]
		}),
		/* @__PURE__ */ jsx(Featured, {}),
		/* @__PURE__ */ jsxs("section", {
			className: "section",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Eyebrow, { children: "THE PROGRAMME" }), /* @__PURE__ */ jsxs("h2", { children: [
					"A DATE WITH",
					/* @__PURE__ */ jsx("br", {}),
					"POSSIBILITY."
				] })] }), /* @__PURE__ */ jsxs(Link, {
					className: "text-link",
					to: "/schedule",
					children: ["View Schedule ", /* @__PURE__ */ jsx(Arrow, {})]
				})]
			}), /* @__PURE__ */ jsx(ScheduleContent, { preview: true })]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "section venue-preview",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "venue-graphic",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "venue-pin",
						children: "↗"
					}),
					/* @__PURE__ */ jsx("div", { className: "venue-lines" }),
					/* @__PURE__ */ jsx("span", {
						className: "micro",
						children: "CRESCENT / AUDITORIUM"
					})
				]
			}), /* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx(Eyebrow, { children: "MEET AT THE AUDITORIUM" }),
				/* @__PURE__ */ jsxs("h2", { children: [
					"THIS IS",
					/* @__PURE__ */ jsx("br", {}),
					"THE PLACE."
				] }),
				/* @__PURE__ */ jsx("p", { children: siteData.settings.venue }),
				/* @__PURE__ */ jsx(ButtonLink, {
					to: "/venue",
					secondary: true,
					children: "Venue Details"
				})
			] })]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "section faq-preview",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx(Eyebrow, { children: "BEFORE YOU STEP IN" }),
				/* @__PURE__ */ jsxs("h2", { children: [
					"GOOD",
					/* @__PURE__ */ jsx("br", {}),
					"QUESTIONS."
				] }),
				/* @__PURE__ */ jsxs(Link, {
					to: "/faqs",
					className: "text-link",
					children: ["All FAQs ", /* @__PURE__ */ jsx(Arrow, {})]
				})
			] }), /* @__PURE__ */ jsx("div", { children: siteData.faqs.slice(0, 3).map((f) => /* @__PURE__ */ jsx(Accordion, { faq: f }, f.id)) })]
		})
	] });
}
function PageHeading({ eyebrow, title, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "page-heading",
		children: [
			/* @__PURE__ */ jsx(Eyebrow, { children: eyebrow }),
			/* @__PURE__ */ jsx("h1", { children: title }),
			children
		]
	});
}
function CategoryPage({ category }) {
	const [params, setParams] = useSearchParams();
	const query = params.get("q") || "";
	const tag = params.get("tag") || "";
	const all = inCategory(category);
	const tags = [...new Set(all.flatMap((e) => e.tags))];
	const list = filterEvents(all, query, tag);
	const update = (name, value) => {
		const next = new URLSearchParams(params);
		if (value) next.set(name, value);
		else next.delete(name);
		setParams(next, {
			replace: true,
			preventScrollReset: true
		});
	};
	return /* @__PURE__ */ jsxs("section", {
		className: `section category-page ${category === "non-technical" ? "orange-page" : ""}`,
		children: [
			/* @__PURE__ */ jsx(PageHeading, {
				eyebrow: `${siteData.categories[category].title} / 08 COMPETITIONS`,
				title: siteData.categories[category].headline,
				children: /* @__PURE__ */ jsx("p", { children: siteData.categories[category].intro })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "category-tabs",
				children: [/* @__PURE__ */ jsxs(Link, {
					"aria-current": category === "technical" ? "page" : void 0,
					to: "/events/technical",
					children: ["Technical ", /* @__PURE__ */ jsx("span", { children: "08" })]
				}), /* @__PURE__ */ jsxs(Link, {
					"aria-current": category === "non-technical" ? "page" : void 0,
					to: "/events/non-technical",
					children: ["Non-Technical ", /* @__PURE__ */ jsx("span", { children: "08" })]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "search-bar",
				children: [
					/* @__PURE__ */ jsx("label", {
						htmlFor: "event-search",
						children: "Find your event"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "search-input",
						children: [/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "⌕"
						}), /* @__PURE__ */ jsx("input", {
							id: "event-search",
							type: "search",
							placeholder: "Search by event name…",
							value: query,
							onChange: (e) => update("q", e.target.value)
						})]
					}),
					tags.length > 0 && /* @__PURE__ */ jsxs("label", { children: ["Filter by tag", /* @__PURE__ */ jsxs("select", {
						value: tag,
						onChange: (e) => update("tag", e.target.value),
						children: [/* @__PURE__ */ jsx("option", {
							value: "",
							children: "All tags"
						}), tags.map((t) => /* @__PURE__ */ jsx("option", { children: t }, t))]
					})] }),
					/* @__PURE__ */ jsxs("button", {
						className: "text-link",
						onClick: () => setParams({}, { replace: true }),
						children: ["Clear Filters ", /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "×"
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "result-count",
				role: "status",
				children: [
					list.length,
					" ",
					list.length === 1 ? "event" : "events",
					" / Official brochure order"
				]
			}),
			list.length ? /* @__PURE__ */ jsx(EventGrid, { events: list }) : /* @__PURE__ */ jsxs("div", {
				className: "empty-state",
				children: [
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ jsx("h2", { children: "No matching events." }),
					/* @__PURE__ */ jsx("p", { children: "Try another name or clear your filters." }),
					/* @__PURE__ */ jsx("button", {
						className: "button",
						onClick: () => setParams({}, { replace: true }),
						children: "Clear Filters"
					})
				]
			})
		]
	});
}
function EventPage() {
	const { slug } = useParams();
	const event = siteData.events.find((e) => e.slug === slug);
	const reduced = useReducedMotion();
	if (!event) return /* @__PURE__ */ jsx(NotFound, {});
	const { previous, next } = neighbours(event);
	const sections = [
		["Rules", event.rules],
		["Participation requirements", event.participation],
		["Rounds & format", event.rounds],
		["Equipment & software", event.equipment],
		["Prizes", event.prizes]
	];
	return /* @__PURE__ */ jsxs("article", {
		className: `event-page ${event.category === "non-technical" ? "orange-page" : ""}`,
		children: [
			/* @__PURE__ */ jsxs("section", {
				className: "section event-hero",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs(Link, {
						className: "text-link",
						to: `/events/${event.category}`,
						children: ["← ", siteData.categories[event.category].title]
					}),
					/* @__PURE__ */ jsxs(Eyebrow, { children: [
						siteData.categories[event.category].short,
						" /",
						" ",
						String(event.order).padStart(2, "0")
					] }),
					/* @__PURE__ */ jsx(motion.h1, {
						layoutId: reduced ? void 0 : `title-${event.id}`,
						children: event.name
					}),
					/* @__PURE__ */ jsx("p", {
						className: "event-subtitle",
						children: event.description || `${siteData.settings.title} · ${siteData.settings.dateLabel}`
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "button-row",
						children: [/* @__PURE__ */ jsx(ButtonLink, {
							to: "/register",
							children: "Register Now"
						}), /* @__PURE__ */ jsx(ShareActions, {})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "eligibility",
						children: siteData.settings.eligibility
					})
				] }), /* @__PURE__ */ jsx(EventArt, {
					event,
					hero: true
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "section event-content",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx(Eyebrow, { children: "THE COMPETITION" }),
					/* @__PURE__ */ jsxs("h2", { children: [
						"MAKE IT",
						/* @__PURE__ */ jsx("br", {}),
						"YOUR MOMENT."
					] }),
					/* @__PURE__ */ jsx("p", { children: event.overview || siteData.copy.eventDetailsPending }),
					sections.filter(([, items]) => items.length).map(([title, items]) => /* @__PURE__ */ jsxs("div", {
						className: "detail-section",
						children: [/* @__PURE__ */ jsx("h2", { children: title }), /* @__PURE__ */ jsx("ul", { children: items.map((item) => /* @__PURE__ */ jsx("li", { children: item }, item)) })]
					}, title)),
					event.faqs.length > 0 && /* @__PURE__ */ jsxs("div", {
						className: "detail-section",
						children: [/* @__PURE__ */ jsx("h2", { children: "Event FAQs" }), event.faqs.map((f) => /* @__PURE__ */ jsx(Accordion, { faq: f }, f.id))]
					})
				] }), /* @__PURE__ */ jsxs("aside", {
					className: "event-facts",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "micro",
							children: "AT A GLANCE"
						}),
						/* @__PURE__ */ jsxs("dl", { children: [
							/* @__PURE__ */ jsx("dt", { children: "Category" }),
							/* @__PURE__ */ jsx("dd", { children: siteData.categories[event.category].short }),
							/* @__PURE__ */ jsx("dt", { children: "Date" }),
							/* @__PURE__ */ jsx("dd", { children: siteData.settings.dateLabel }),
							/* @__PURE__ */ jsx("dt", { children: "Venue" }),
							/* @__PURE__ */ jsx("dd", { children: siteData.settings.venue }),
							/* @__PURE__ */ jsx("dt", { children: "Eligibility" }),
							/* @__PURE__ */ jsx("dd", { children: siteData.settings.eligibility })
						] }),
						event.faculty.map((p) => /* @__PURE__ */ jsx(CoordinatorCard, { person: p }, p.id)),
						event.students.map((p) => /* @__PURE__ */ jsx(CoordinatorCard, { person: p }, p.id))
					]
				})]
			}),
			/* @__PURE__ */ jsxs("nav", {
				className: "event-pagination",
				"aria-label": "Events in brochure order",
				children: [previous ? /* @__PURE__ */ jsxs(Link, {
					to: `/events/${previous.slug}`,
					children: [/* @__PURE__ */ jsx("span", {
						className: "micro",
						children: "← PREVIOUS EVENT"
					}), /* @__PURE__ */ jsx("strong", { children: previous.name })]
				}) : /* @__PURE__ */ jsxs(Link, {
					to: `/events/${event.category}`,
					children: [/* @__PURE__ */ jsx("span", {
						className: "micro",
						children: "FIRST IN THIS CATEGORY"
					}), /* @__PURE__ */ jsxs("strong", { children: [
						"All ",
						siteData.categories[event.category].short,
						" Events"
					] })]
				}), next ? /* @__PURE__ */ jsxs(Link, {
					to: `/events/${next.slug}`,
					children: [/* @__PURE__ */ jsx("span", {
						className: "micro",
						children: "NEXT EVENT →"
					}), /* @__PURE__ */ jsx("strong", { children: next.name })]
				}) : /* @__PURE__ */ jsxs(Link, {
					to: `/events/${event.category}`,
					children: [/* @__PURE__ */ jsx("span", {
						className: "micro",
						children: "YOU’VE EXPLORED THE CATEGORY"
					}), /* @__PURE__ */ jsx("strong", { children: "Back to all events ↗" })]
				})]
			}),
			event.relatedIds.length > 0 && /* @__PURE__ */ jsxs("section", {
				className: "section",
				children: [/* @__PURE__ */ jsx("h2", { children: "KEEP EXPLORING." }), /* @__PURE__ */ jsx(EventGrid, { events: siteData.events.filter((e) => event.relatedIds.includes(e.id)) })]
			})
		]
	});
}
function Registration() {
	const now = useNow();
	const config = siteData.registration;
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		setLoaded(false);
		setFailed(false);
		if (!assetExists(config.qr)) return;
		const image = new Image();
		image.onload = () => setLoaded(true);
		image.onerror = () => setFailed(true);
		image.src = config.qr;
		return () => {
			image.onload = null;
			image.onerror = null;
		};
	}, [config.qr]);
	const status = now === null ? "unconfigured" : registrationStatus(config, now, !failed && assetExists(config.qr));
	const archived = now !== null && isArchived(now);
	return /* @__PURE__ */ jsxs("section", {
		className: "section registration-page",
		children: [/* @__PURE__ */ jsx(PageHeading, {
			eyebrow: "REGISTRATION / TALENT HUNT 2K26",
			title: "TAKE YOUR\nPLACE."
		}), /* @__PURE__ */ jsxs("div", {
			className: "registration-panel",
			children: [/* @__PURE__ */ jsx("div", {
				className: "registration-mark",
				"aria-hidden": "true",
				children: "↗"
			}), /* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsxs("span", {
					className: `status-pill ${status === "open" && !archived ? "status-open" : ""}`,
					children: [
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "●"
						}),
						" ",
						archived ? "Registration Closed" : status === "open" ? "Register Now" : status === "soon" ? "Registration Opens Soon" : status === "closed" ? "Registration Closed" : "STAY READY."
					]
				}),
				/* @__PURE__ */ jsx("h2", { children: archived || status === "closed" ? "REGISTRATION\nHAS CLOSED." : status === "open" ? "YOUR NEXT STEP." : "YOUR MOMENT\nIS COMING." }),
				/* @__PURE__ */ jsx("p", { children: archived ? siteData.settings.archiveMessage : status === "unconfigured" ? siteData.copy.registrationPending : status === "soon" ? "The official registration window has not opened yet." : status === "closed" ? "The official registration window has closed." : "Complete your registration through the official Google Form." }),
				status === "open" && !archived && loaded && /* @__PURE__ */ jsxs("div", {
					className: "registration-actions",
					children: [/* @__PURE__ */ jsx("a", {
						href: config.url,
						target: "_blank",
						rel: "noopener noreferrer",
						"aria-label": "Open registration form using QR code",
						children: /* @__PURE__ */ jsx("img", {
							src: config.qr,
							alt: "Official registration QR code",
							width: "220",
							height: "220",
							onError: () => {
								setLoaded(false);
								setFailed(true);
							}
						})
					}), /* @__PURE__ */ jsx("a", {
						className: "button",
						href: config.url,
						target: "_blank",
						rel: "noopener noreferrer",
						children: "Open Registration Form ↗"
					})]
				}),
				config.instructions.length > 0 && /* @__PURE__ */ jsx("ul", { children: config.instructions.map((v) => /* @__PURE__ */ jsx("li", { children: v }, v)) }),
				/* @__PURE__ */ jsxs("div", {
					className: "eligibility-box",
					children: [/* @__PURE__ */ jsx("strong", { children: siteData.settings.eligibility }), /* @__PURE__ */ jsx("p", { children: siteData.settings.eligibilityNote })]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "small-print",
					children: "Registration is completed externally. This website does not collect submissions or confirm registration."
				}),
				/* @__PURE__ */ jsx(Link, {
					className: "text-link",
					to: "/faqs",
					children: "Registration questions? ↗"
				})
			] })]
		})]
	});
}
function StandardPage({ page }) {
	const m = siteData.pages[page];
	return /* @__PURE__ */ jsxs("section", {
		className: "section standard-page",
		children: [
			/* @__PURE__ */ jsx(PageHeading, {
				eyebrow: `TALENT HUNT 2K26 / ${page.slice(1).toUpperCase()}`,
				title: m.title
			}),
			page === "/schedule" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(DateStrip, {}), /* @__PURE__ */ jsx(ScheduleContent, {})] }),
			page === "/about" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
				className: "editorial-grid",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("h2", { children: [
						"16 WAYS TO",
						/* @__PURE__ */ jsx("br", {}),
						/* @__PURE__ */ jsx("em", { children: "SHOW UP." })
					] }),
					/* @__PURE__ */ jsx("p", { children: siteData.copy.about }),
					/* @__PURE__ */ jsx("p", { children: siteData.settings.eligibility }),
					/* @__PURE__ */ jsxs("div", {
						className: "button-row",
						children: [/* @__PURE__ */ jsx(ButtonLink, {
							to: "/events/technical",
							children: "Technical Events"
						}), /* @__PURE__ */ jsx(ButtonLink, {
							to: "/events/non-technical",
							secondary: true,
							children: "Non-Technical Events"
						})]
					})
				] }), /* @__PURE__ */ jsx(SmartImage, {
					className: "about-brochure",
					src: siteData.assets.brochureImage,
					alt: "Official Talent Hunt 2K26 brochure",
					width: "1024",
					height: "1536"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "organiser-block",
				children: [
					/* @__PURE__ */ jsx(Eyebrow, { children: "PRESENTED BY" }),
					/* @__PURE__ */ jsx("h2", { children: siteData.settings.department }),
					/* @__PURE__ */ jsx("p", { children: siteData.settings.school }),
					/* @__PURE__ */ jsx("p", { children: siteData.settings.college })
				]
			})] }),
			page === "/venue" && /* @__PURE__ */ jsxs("div", {
				className: "venue-full",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "venue-graphic",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "venue-pin",
							children: "↗"
						}),
						/* @__PURE__ */ jsx("div", { className: "venue-lines" }),
						/* @__PURE__ */ jsx("span", {
							className: "micro",
							children: "CRESCENT / AUDITORIUM"
						})
					]
				}), /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx(Eyebrow, { children: "THE OFFICIAL VENUE" }),
					/* @__PURE__ */ jsx("h2", { children: "AUDITORIUM." }),
					/* @__PURE__ */ jsx("p", { children: siteData.settings.college }),
					/* @__PURE__ */ jsxs("p", { children: [
						siteData.settings.dateLabel,
						" · ",
						siteData.settings.weekday
					] }),
					siteData.settings.address && /* @__PURE__ */ jsx("address", { children: siteData.settings.address }),
					siteData.settings.directions.length ? siteData.settings.directions.map((d) => /* @__PURE__ */ jsx("p", { children: d }, d)) : /* @__PURE__ */ jsx("p", {
						className: "muted",
						children: siteData.copy.venuePending
					}),
					/* @__PURE__ */ jsx(ButtonLink, {
						to: "/schedule",
						secondary: true,
						children: "View Programme"
					})
				] })]
			}),
			page === "/faqs" && /* @__PURE__ */ jsx("div", {
				className: "faq-groups",
				children: [...new Set(siteData.faqs.map((f) => f.category))].map((category) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: category }), siteData.faqs.filter((f) => f.category === category).map((f) => /* @__PURE__ */ jsx(Accordion, { faq: f }, f.id))] }, category))
			}),
			page === "/contact" && /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsxs("p", {
					className: "page-lead",
					children: [
						siteData.settings.department,
						/* @__PURE__ */ jsx("br", {}),
						siteData.settings.school
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "people-grid",
					children: siteData.coordinators.map((p) => /* @__PURE__ */ jsx(CoordinatorCard, { person: p }, p.id))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "contact-social",
					children: [
						/* @__PURE__ */ jsx(Eyebrow, { children: "FOLLOW THE EVENT" }),
						siteData.socialLinks.map((s) => /* @__PURE__ */ jsxs("a", {
							className: "text-link",
							href: s.url,
							target: "_blank",
							rel: "noopener noreferrer",
							children: [s.handle, " ↗"]
						}, s.url)),
						/* @__PURE__ */ jsx("p", { children: "Coordinator contact methods will be added when officially supplied." })
					]
				})
			] }),
			page === "/privacy" && /* @__PURE__ */ jsx("div", {
				className: "prose",
				children: siteData.copy.privacy.map((p) => /* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", { children: p.title }), /* @__PURE__ */ jsx("p", { children: p.text })] }, p.title))
			})
		]
	});
}
function NotFound() {
	return /* @__PURE__ */ jsxs("section", {
		className: "section not-found",
		children: [
			/* @__PURE__ */ jsx(Eyebrow, { children: "OFF THE PROGRAMME" }),
			/* @__PURE__ */ jsxs("div", {
				className: "error-number",
				"aria-hidden": "true",
				children: [
					"4",
					/* @__PURE__ */ jsx("span", { children: "0" }),
					"4"
				]
			}),
			/* @__PURE__ */ jsx("h1", { children: "PAGE NOT FOUND." }),
			/* @__PURE__ */ jsx("p", { children: "This link doesn’t lead to an event. Let’s find your way back." }),
			/* @__PURE__ */ jsxs("div", {
				className: "button-row",
				children: [/* @__PURE__ */ jsx(ButtonLink, {
					to: "/",
					children: "Return Home"
				}), /* @__PURE__ */ jsx(ButtonLink, {
					to: "/events/technical",
					secondary: true,
					children: "Explore Events"
				})]
			})
		]
	});
}
function CoordinatorsPage() {
	const groups = siteData.coordinatorGroups;
	const [activeTab, setActiveTab] = useState(groups[0]?.id ?? "");
	const current = groups.find((g) => g.id === activeTab) ?? groups[0];
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsxs("section", {
		className: "section coordinators-page",
		children: [
			/* @__PURE__ */ jsx(PageHeading, {
				eyebrow: "TALENT HUNT 2K26 / THE TEAM",
				title: "MEET THE CREW.",
				children: /* @__PURE__ */ jsx("p", { children: "Faculty advisors, student general coordinators, and event leads who make Talent Hunt happen." })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "coord-tabs",
				role: "tablist",
				"aria-label": "Coordinator groups",
				children: groups.map((g) => /* @__PURE__ */ jsxs("button", {
					role: "tab",
					id: `tab-${g.id}`,
					"aria-selected": g.id === activeTab,
					"aria-controls": `panel-${g.id}`,
					className: `coord-tab ${g.id === activeTab ? "coord-tab-active" : ""}`,
					onClick: () => setActiveTab(g.id),
					children: [g.label, /* @__PURE__ */ jsx("span", {
						className: "coord-tab-count",
						children: g.members.length
					})]
				}, g.id))
			}),
			/* @__PURE__ */ jsx(AnimatePresence, {
				mode: "wait",
				children: /* @__PURE__ */ jsx(motion.div, {
					id: `panel-${activeTab}`,
					role: "tabpanel",
					"aria-labelledby": `tab-${activeTab}`,
					initial: reduced ? false : {
						opacity: 0,
						y: 20
					},
					animate: {
						opacity: 1,
						y: 0
					},
					exit: reduced ? {} : {
						opacity: 0,
						y: -10
					},
					transition: {
						duration: .35,
						ease: [
							.22,
							1,
							.36,
							1
						]
					},
					className: "coord-grid",
					children: current?.members.map((p, i) => /* @__PURE__ */ jsx(motion.div, {
						initial: reduced ? false : {
							opacity: 0,
							y: 28
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: {
							duration: .5,
							delay: i * .055,
							ease: [
								.22,
								1,
								.36,
								1
							]
						},
						children: /* @__PURE__ */ jsx(CoordinatorCard, { person: p })
					}, p.id))
				}, activeTab)
			})
		]
	});
}
//#endregion
//#region src/App.tsx
function PresenceGuard({ children }) {
	const present = useIsPresent();
	return /* @__PURE__ */ jsx("div", {
		"aria-hidden": !present || void 0,
		inert: !present,
		children
	});
}
function App() {
	const location = useLocation();
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(MotionConfig, {
		reducedMotion: "user",
		children: /* @__PURE__ */ jsxs(LayoutGroup, { children: [
			/* @__PURE__ */ jsx(Header, {}),
			/* @__PURE__ */ jsx(NavigationEffects, {}),
			/* @__PURE__ */ jsx("div", {
				className: "route-accent",
				"aria-hidden": "true"
			}, `accent-${location.pathname}`),
			/* @__PURE__ */ jsx("main", {
				id: "main",
				tabIndex: -1,
				children: /* @__PURE__ */ jsx(AnimatePresence, {
					mode: "wait",
					initial: false,
					children: /* @__PURE__ */ jsx(motion.div, {
						initial: reduced ? false : {
							opacity: 0,
							y: 16
						},
						animate: {
							opacity: 1,
							y: 0
						},
						exit: {
							opacity: 0,
							y: reduced ? 0 : -12
						},
						transition: {
							duration: reduced ? 0 : .35,
							ease: [
								.16,
								1,
								.3,
								1
							]
						},
						children: /* @__PURE__ */ jsx(PresenceGuard, { children: /* @__PURE__ */ jsxs(Routes, {
							location,
							children: [
								/* @__PURE__ */ jsx(Route, {
									path: "/",
									element: /* @__PURE__ */ jsx(Home, {})
								}),
								/* @__PURE__ */ jsx(Route, {
									path: "/events/technical",
									element: /* @__PURE__ */ jsx(CategoryPage, { category: "technical" })
								}),
								/* @__PURE__ */ jsx(Route, {
									path: "/events/non-technical",
									element: /* @__PURE__ */ jsx(CategoryPage, { category: "non-technical" })
								}),
								/* @__PURE__ */ jsx(Route, {
									path: "/events/:slug",
									element: /* @__PURE__ */ jsx(EventPage, {})
								}),
								/* @__PURE__ */ jsx(Route, {
									path: "/register",
									element: /* @__PURE__ */ jsx(Registration, {})
								}),
								/* @__PURE__ */ jsx(Route, {
									path: "/coordinators",
									element: /* @__PURE__ */ jsx(CoordinatorsPage, {})
								}),
								[
									"/schedule",
									"/about",
									"/venue",
									"/faqs",
									"/contact",
									"/privacy"
								].map((path) => /* @__PURE__ */ jsx(Route, {
									path,
									element: /* @__PURE__ */ jsx(StandardPage, { page: path })
								}, path)),
								/* @__PURE__ */ jsx(Route, {
									path: "*",
									element: /* @__PURE__ */ jsx(NotFound, {})
								})
							]
						}) })
					}, location.pathname)
				})
			}),
			/* @__PURE__ */ jsx(Footer, {})
		] })
	}) });
}
//#endregion
//#region src/entry-server.tsx
function render(path) {
	return renderToString(/* @__PURE__ */ jsx(StaticRouter, {
		location: path,
		children: /* @__PURE__ */ jsx(App, {})
	}));
}
//#endregion
export { metadata, publicRoutes, render, siteData, validateSiteData };
