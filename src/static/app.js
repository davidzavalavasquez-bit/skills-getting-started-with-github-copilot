document.addEventListener("DOMContentLoaded", () => {
	// Contenedor principal; si no existe, crearlo
	let container = document.getElementById("activities");
	if (!container) {
		container = document.createElement("div");
		container.id = "activities";
		document.body.appendChild(container);
	}

	const msg = document.createElement("div");
	msg.id = "message";
	msg.style.margin = "10px 0";
	document.body.insertBefore(msg, container);

	// Helper para mostrar mensajes
	function showMessage(text, isError = false) {
		msg.textContent = text;
		msg.style.color = isError ? "crimson" : "green";
		setTimeout(() => { if (msg.textContent === text) msg.textContent = ""; }, 4000);
	}

	// Cargar y renderizar actividades
	async function loadActivities() {
		container.innerHTML = "Cargando actividades...";
		try {
			const res = await fetch("/activities");
			if (!res.ok) throw new Error(`Error ${res.status}`);
			const activities = await res.json();
			renderActivities(activities);
		} catch (err) {
			container.innerHTML = "";
			showMessage("No se pudieron cargar las actividades.", true);
			console.error(err);
		}
	}

	// Renderiza la lista y formularios de inscripción
	function renderActivities(activities) {
		container.innerHTML = "";
		const list = document.createElement("div");
		Object.keys(activities).forEach((name) => {
			const a = activities[name];

			const card = document.createElement("div");
			card.style.border = "1px solid #ddd";
			card.style.padding = "10px";
			card.style.margin = "8px 0";
			card.style.borderRadius = "6px";

			const title = document.createElement("h3");
			title.textContent = name;
			card.appendChild(title);

			const desc = document.createElement("p");
			desc.textContent = a.description;
			card.appendChild(desc);

			const meta = document.createElement("p");
			meta.style.fontSize = "90%";
			meta.style.color = "#555";
			meta.textContent = `Horario: ${a.schedule} — Participantes: ${a.participants.length}/${a.max_participants}`;
			card.appendChild(meta);

			// Lista de participantes (ahora como una lista con viñetas)
			const participantsWrap = document.createElement("div");
			participantsWrap.style.marginTop = "6px";
			participantsWrap.style.fontSize = "90%";
			participantsWrap.style.color = "#333";

			const participantsHeading = document.createElement("strong");
			participantsHeading.textContent = "Inscritos:";
			participantsHeading.style.display = "block";
			participantsHeading.style.marginBottom = "6px";
			participantsHeading.style.fontWeight = "600";
			participantsWrap.appendChild(participantsHeading);

			if (Array.isArray(a.participants) && a.participants.length > 0) {
				const ul = document.createElement("ul");
				ul.style.margin = "0";
				ul.style.padding = "0 0 0 18px";
				ul.style.lineHeight = "1.35";
				ul.style.color = "#374151";

				a.participants.forEach((p) => {
						const li = document.createElement("li");
						li.style.marginBottom = "6px";
						li.style.listStyleType = "none"; // hide default bullets; styled via CSS
						li.style.display = "flex";
						li.style.alignItems = "center";

						const span = document.createElement("span");
						span.textContent = p;
						span.style.flex = "1";
						li.appendChild(span);

						// Delete icon/button
						const delBtn = document.createElement("button");
						delBtn.type = "button";
						delBtn.title = "Eliminar participante";
						delBtn.textContent = "✖";
						delBtn.style.marginLeft = "8px";
						delBtn.style.border = "none";
						delBtn.style.background = "transparent";
						delBtn.style.cursor = "pointer";
						delBtn.style.color = "#ef4444"; // red tone
						delBtn.style.fontSize = "0.95rem";

						delBtn.addEventListener("click", async () => {
							if (!confirm(`¿Eliminar ${p} de ${name}?`)) return;
							try {
								const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
									method: "DELETE"
								});
								const data = await resp.json().catch(() => ({}));
								if (!resp.ok) {
									const detail = data.detail || data.message || `Error ${resp.status}`;
									showMessage(`Error: ${detail}`, true);
								} else {
									showMessage(data.message || "Participante eliminado");
									await loadActivities();
								}
							} catch (err) {
								showMessage("Fallo en la comunicaci\u00f3n con el servidor.", true);
								console.error(err);
							}
						});

						ul.appendChild(li);
						li.appendChild(delBtn);
				});
				participantsWrap.appendChild(ul);
			} else {
				const empty = document.createElement("div");
				empty.textContent = "— Ninguno por ahora —";
				empty.style.fontStyle = "italic";
				empty.style.color = "#6b7280";
				participantsWrap.appendChild(empty);
			}
			card.appendChild(participantsWrap);

			// Formulario simple
			const form = document.createElement("form");
			form.style.marginTop = "8px";

			const emailInput = document.createElement("input");
			emailInput.type = "email";
			emailInput.placeholder = "tu@correo.edu";
			emailInput.required = true;
			emailInput.style.marginRight = "8px";
			emailInput.style.padding = "6px";
			emailInput.style.width = "220px";

			const btn = document.createElement("button");
			btn.type = "submit";
			btn.textContent = "Inscribirse";

			form.appendChild(emailInput);
			form.appendChild(btn);
			card.appendChild(form);

			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const email = emailInput.value.trim();
				if (!email) return showMessage("Ingresa un email válido.", true);
				btn.disabled = true;
				btn.textContent = "Enviando...";
				try {
					const resp = await fetch(`/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`, {
						method: "POST"
					});
					const data = await resp.json().catch(() => ({}));
					if (!resp.ok) {
						const detail = data.detail || data.message || `Error ${resp.status}`;
						showMessage(`Error: ${detail}`, true);
					} else {
						showMessage(data.message || "Inscripción exitosa");
						// Actualizar la vista recargando actividades
						await loadActivities();
					}
				} catch (err) {
					showMessage("Fallo en la comunicación con el servidor.", true);
					console.error(err);
				} finally {
					btn.disabled = false;
					btn.textContent = "Inscribirse";
				}
			});

			list.appendChild(card);
		});

		if (Object.keys(activities).length === 0) {
			container.textContent = "No hay actividades disponibles.";
		} else {
			container.appendChild(list);
		}
	}

	loadActivities();
});
