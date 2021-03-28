interface ExtraAttributes {
	role: string
}

declare namespace JSX {

	interface Element extends HTMLElement, SVGElement { }

	type IntrinsicElements = {
		[ P in keyof HTMLElementTagNameMap ]: Partial<HTMLElementTagNameMap[ P ] & ExtraAttributes>
	}

}
