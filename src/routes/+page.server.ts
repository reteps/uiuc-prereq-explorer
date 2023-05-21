export async function load({ fetch }) {
	const res = await fetch(`/uiuc-prerequisites.json`);
	const data = await res.json();

	return { prereqs: data };
}
