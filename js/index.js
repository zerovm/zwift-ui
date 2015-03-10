function toggle_show_password() {
    el = document.getElementById("auth_key");
    el.type = el.type == "password" ? "text" : "password";
}

document.getElementById("show_key").onclick = toggle_show_password;
