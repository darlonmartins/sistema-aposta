import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_login import LoginManager
from src.models.user import db, User
from src.models.aposta import Aposta
from src.routes.user import user_bp
from src.routes.aposta import aposta_bp

# (Opcional) CORS: habilite se o front for outro domínio (ex.: Vercel)
try:
    from flask_cors import CORS
    USE_CORS = True
except Exception:
    USE_CORS = False

BASE_DIR = os.path.dirname(__file__)

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'))

# Secret key em env (fallback para dev)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-me')

# DB: usa env DATABASE_URL, senão SQLite local (dev)
db_url = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'database', 'app.db')}")
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Conexão mais resiliente (útil em cloud)
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True}

# Inicializa DB
db.init_app(app)
with app.app_context():
    db.create_all()

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'user.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(aposta_bp, url_prefix='/api')

# CORS (opcional)
if USE_CORS:
    # troque a origem pelo seu domínio do Vercel quando souber
    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

# Healthcheck simples
@app.get("/health")
def health():
    return {"status": "ok"}, 200

# Servir frontend estático
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if not static_folder_path:
        return "Static folder not configured", 404

    candidate = os.path.join(static_folder_path, path)
    if path and os.path.exists(candidate):
        return send_from_directory(static_folder_path, path)

    index_path = os.path.join(static_folder_path, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder_path, 'index.html')
    return "index.html not found", 404

if __name__ == '__main__':
    # Em produção (Render), use PORT do ambiente e desligue o debug
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "development") != "production"
    app.run(host='0.0.0.0', port=port, debug=debug)
