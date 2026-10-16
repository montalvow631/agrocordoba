from datetime import datetime, timezone
import json
import re

from flask import redirect

from app import (
    AccountSettings,
    Favorite,
    PasswordResetVerification,
    ProductCertification,
    ProducerProduct,
    ProductListing,
    QuotationRecord,
    ReadNotification,
    SettingsVerification,
    User,
    app as flask_app,
    _apply_product_fields,
    _migrate_normalized_tables,
    _product_payload,
    db,
    google,
)
from sqlalchemy import inspect, text


def create_user(**overrides):
    values = {
        "google_sub": "google-user-123",
        "email": "campesino@example.com",
        "name": "María Pérez",
        "avatar": "https://example.com/avatar.png",
        "registered_at": datetime(2026, 1, 2, tzinfo=timezone.utc),
    }
    values.update(overrides)
    user = User(**values)
    db.session.add(user)
    db.session.commit()
    return user


def test_health_reports_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_me_requires_a_session(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.get_json() == {"error": "No hay una sesión iniciada."}


def test_me_returns_public_user_data(client):
    user = create_user()
    with client.session_transaction() as session:
        session["user_id"] = user.id

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    payload = response.get_json()["user"]
    assert payload["id"] == user.id
    assert payload["name"] == "María Pérez"
    assert payload["email"] == "campesino@example.com"
    assert payload["role"] == "cliente"
    assert payload["city"] == "Montería"
    assert payload["status"] == "activo"
    assert "google_sub" not in payload


def test_me_clears_a_session_for_a_missing_user(client):
    with client.session_transaction() as session:
        session["user_id"] = "missing-user-id"

    response = client.get("/api/auth/me")

    assert response.status_code == 401
    with client.session_transaction() as session:
        assert "user_id" not in session


def test_local_registration_returns_the_created_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Compradora de prueba",
            "email": "compradora@example.com",
            "password": "StrongPass123",
            "gender": "femenino",
            "phone": "3001234567",
            "city": "Montería",
            "role": "cliente",
        },
    )

    assert response.status_code == 201
    assert response.is_json
    assert response.get_json()["user"]["email"] == "compradora@example.com"
    assert response.get_json()["user"]["role"] == "cliente"
    assert User.query.filter_by(email="compradora@example.com").first() is not None


def test_producer_registration_stores_products_as_rows(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Productora de prueba",
            "email": "productora@example.com",
            "password": "StrongPass123",
            "gender": "femenino",
            "phone": "3001234567",
            "city": "Montería",
            "role": "productor",
            "farmName": "Finca de prueba",
            "association": "Asociación de prueba",
            "products": ["Yuca", "Ñame", "Yuca"],
        },
    )

    assert response.status_code == 201
    user = User.query.filter_by(email="productora@example.com").first()
    assert user is not None
    assert response.get_json()["user"]["products"] == ["Yuca", "Ñame"]
    assert [item.name for item in ProducerProduct.query.filter_by(user_id=user.id).order_by(ProducerProduct.id)] == [
        "Yuca",
        "Ñame",
    ]


def test_local_registration_rejects_duplicate_email_with_json(client):
    create_user()

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Otro usuario",
            "email": "campesino@example.com",
            "password": "StrongPass123",
            "gender": "masculino",
            "phone": "3001234567",
            "city": "Montería",
            "role": "cliente",
        },
    )

    assert response.status_code == 409
    assert response.is_json
    assert "Ya existe" in response.get_json()["error"]


def test_logout_clears_the_session(client):
    with client.session_transaction() as session:
        session["user_id"] = "some-user-id"

    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert response.get_json() == {"ok": True}
    with client.session_transaction() as session:
        assert "user_id" not in session


def test_user_email_and_google_subject_must_be_unique(client):
    create_user()
    duplicate_email = User(google_sub="another-sub", email="campesino@example.com", name="Otro")
    db.session.add(duplicate_email)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
    else:
        raise AssertionError("La base de datos aceptó un correo duplicado")

    duplicate_subject = User(google_sub="google-user-123", email="otro@example.com", name="Otro")
    db.session.add(duplicate_subject)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
    else:
        raise AssertionError("La base de datos aceptó un identificador Google duplicado")


def login_as(client, user):
    with client.session_transaction() as session:
        session["user_id"] = user.id


def product_payload(**overrides):
    values = {
        "name": "Yuca",
        "category": "Tubérculos y Raíces",
        "priceCopKg": 2500,
        "priceUsdKg": 0.6,
        "stockAvailableKg": 1000,
        "stockMinKg": 100,
        "minOrderKg": 50,
        "lat": 8.75,
        "lng": -75.88,
        "municipalityId": "monteria",
        "municipalityName": "Montería",
    }
    values.update(overrides)
    return values


def create_listing(producer, payload=None):
    listing = ProductListing(producer_id=producer.id)
    _apply_product_fields(listing, payload or product_payload())
    db.session.add(listing)
    db.session.flush()
    return listing


def create_quotation(client_id, producer_id, product_id="reference-product", **overrides):
    values = {
        "client_id": client_id,
        "producer_id": producer_id,
        "product_id": product_id,
        "product_name": "Yuca",
        "client_name": "Comprador",
    }
    values.update(overrides)
    quotation = QuotationRecord(**values)
    db.session.add(quotation)
    db.session.flush()
    return quotation


def test_product_validation_accepts_cordoba_negative_longitude():
    valid, error = _product_payload(product_payload())

    assert error is None
    assert valid["lng"] == -75.88


def test_active_producer_can_publish_product_with_negative_longitude(client):
    producer = create_user(
        google_sub="producer-sub",
        email="producer@example.com",
        role="productor",
        status="activo",
    )
    login_as(client, producer)

    response = client.post(
        "/api/products",
        json=product_payload(certifications=["Orgánica", "Comercio justo"]),
    )

    assert response.status_code == 201
    payload = response.get_json()["product"]
    assert payload["lng"] == -75.88
    assert payload["certifications"] == ["Orgánica", "Comercio justo"]
    assert ProductCertification.query.count() == 2
    assert "data" not in {column["name"] for column in inspect(db.engine).get_columns("product_listing")}


def test_product_page_includes_server_rendered_metadata_and_schema(client, tmp_path, monkeypatch):
    producer = create_user(
        google_sub="seo-producer-sub",
        email="seo-producer@example.com",
        role="productor",
        status="activo",
    )
    listing = create_listing(
        producer,
        product_payload(
            name="Ñame espino",
            description="Ñame fresco de Córdoba.",
            image="/images/name-real.jpg",
            municipalityName="Ciénaga de Oro",
        ),
    )
    db.session.add(listing)
    db.session.commit()
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    (dist_dir / "index.html").write_text(
        '<!doctype html><html><head><title>AgroCórdoba</title>'
        '<meta name="description" content="Inicio" />'
        '<link rel="canonical" href="https://agrocordoba.onrender.com/" />'
        '<meta property="og:url" content="https://agrocordoba.onrender.com/" />'
        '<meta property="og:title" content="Inicio" />'
        '<meta property="og:description" content="Inicio" />'
        '<meta property="og:image" content="" />'
        '</head><body><div id="root"></div></body></html>',
        encoding="utf-8",
    )
    monkeypatch.setenv("FRONTEND_DIST_DIR", str(dist_dir))

    response = client.get(f"/producto/name/{listing.id}")
    html_response = response.get_data(as_text=True)
    schema_match = re.search(
        r'<script[^>]*type="application/ld\+json">(.*?)</script>',
        html_response,
    )

    assert response.status_code == 200
    assert "<title>Ñame espino en Ciénaga de Oro | AgroCórdoba</title>" in html_response
    assert 'rel="canonical" href="http://localhost/producto/name-espino/' in html_response
    assert "<h1>Ñame espino</h1>" in html_response
    assert schema_match is not None
    schema = json.loads(schema_match.group(1))
    assert schema["@type"] == "Product"
    assert schema["offers"]["price"] == 2500
    assert schema["offers"]["priceSpecification"]["unitCode"] == "KGM"


def test_sitemap_lists_active_public_product_pages(client):
    producer = create_user(
        google_sub="sitemap-producer-sub",
        email="sitemap-producer@example.com",
        role="productor",
        status="activo",
    )
    listing = create_listing(producer, product_payload(name="Ñame espino"))
    db.session.commit()

    response = client.get("/sitemap.xml")
    sitemap = response.get_data(as_text=True)

    assert response.status_code == 200
    assert response.mimetype == "application/xml"
    assert f"/producto/name-espino/{listing.id}" in sitemap


def test_admin_can_list_quotes_and_edit_products(client):
    producer = create_user(
        google_sub="producer-for-admin",
        email="producer-admin@example.com",
        role="productor",
        status="activo",
    )
    admin = create_user(
        google_sub="admin-sub",
        email="admin@example.com",
        role="admin",
    )
    listing = create_listing(producer)
    quote = create_quotation(
        client_id=create_user(google_sub="buyer-for-quote", email="buyer-quote@example.com").id,
        producer_id=producer.id,
    )
    db.session.commit()
    login_as(client, admin)

    quotes_response = client.get("/api/quotations")
    edit_response = client.put(
        f"/api/products/{listing.id}",
        json=product_payload(priceCopKg=2700),
    )

    assert quotes_response.status_code == 200
    assert len(quotes_response.get_json()["quotations"]) == 1
    assert edit_response.status_code == 200
    assert edit_response.get_json()["product"]["priceCopKg"] == 2700


def test_admin_product_create_requires_active_producer(client):
    producer = create_user(
        google_sub="active-producer-for-admin-create",
        email="active-admin-product@example.com",
        role="productor",
        status="activo",
    )
    admin = create_user(google_sub="admin-create-sub", email="admin-create@example.com", role="admin")
    login_as(client, admin)

    response = client.post("/api/admin/products", json=product_payload(producerId=producer.id))

    assert response.status_code == 201
    assert response.get_json()["product"]["producerId"] == producer.id


def test_favorites_are_saved_per_buyer(client):
    first = create_user(google_sub="favorite-buyer-1", email="favorite-one@example.com")
    second = create_user(google_sub="favorite-buyer-2", email="favorite-two@example.com")
    login_as(client, first)

    save_response = client.put("/api/favorites", json={"favoriteIds": ["prod-1", "prod-2"]})
    assert save_response.status_code == 200
    assert set(save_response.get_json()["favoriteIds"]) == {"prod-1", "prod-2"}
    assert set(client.get("/api/favorites").get_json()["favoriteIds"]) == {"prod-1", "prod-2"}

    login_as(client, second)
    list_response = client.get("/api/favorites")
    assert list_response.status_code == 200
    assert list_response.get_json()["favoriteIds"] == []


def test_read_notifications_only_include_buyers_own_quotes(client):
    first = create_user(google_sub="notify-buyer-1", email="notify-one@example.com")
    second = create_user(google_sub="notify-buyer-2", email="notify-two@example.com")
    producer = create_user(google_sub="notify-producer", email="notify-producer@example.com", role="productor")
    quote = create_quotation(first.id, producer.id, product_id="prod-1")
    db.session.commit()
    login_as(client, second)

    response = client.put("/api/notifications/read", json={"quotationIds": [quote.id]})

    assert response.status_code == 200
    assert response.get_json()["quotationIds"] == []
    assert ReadNotification.query.count() == 0


def test_quotation_fields_are_relational_and_survive_product_deletion(client):
    producer = create_user(
        google_sub="quote-producer",
        email="quote-producer@example.com",
        role="productor",
        status="activo",
        phone="3001234567",
        association="Asociación de prueba",
    )
    buyer = create_user(
        google_sub="quote-buyer",
        email="quote-buyer@example.com",
        phone="3007654321",
        business_type="Restaurante",
    )
    listing = create_listing(producer)
    db.session.commit()
    login_as(client, buyer)

    response = client.post(
        "/api/quotations",
        json={
            "productId": listing.id,
            "quantityKg": 50,
            "freightCop": 1000,
            "destinationZone": "Local Córdoba",
            "notes": "Entrega de ejemplo",
        },
    )

    assert response.status_code == 201
    quote_data = response.get_json()["quotation"]
    quote = db.session.get(QuotationRecord, quote_data["id"])
    assert quote is not None
    assert quote.product_listing_id == listing.id
    assert quote.total_cop == 126000
    assert quote_data["productId"] == listing.id
    assert quote_data["totalUsd"] == 126000 / 4150
    assert "data" not in {column["name"] for column in inspect(db.engine).get_columns("quotation_record")}

    login_as(client, producer)
    deleted = client.delete(f"/api/products/{listing.id}")

    assert deleted.status_code == 200
    db.session.expire(quote)
    assert quote.product_listing_id is None
    assert client.get("/api/quotations").get_json()["quotations"][0]["productName"] == "Yuca"


def test_legacy_json_columns_are_migrated_without_losing_values(client):
    producer = create_user(
        google_sub="legacy-producer",
        email="legacy-producer@example.com",
        role="productor",
    )
    buyer = create_user(
        google_sub="legacy-buyer",
        email="legacy-buyer@example.com",
    )
    listing = create_listing(producer)
    quote = create_quotation(buyer.id, producer.id, listing.id)
    challenge = SettingsVerification(
        user_id=buyer.id,
        code_hash="legacy-hash",
        expires_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        sent_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
    )
    settings = AccountSettings(user_id=buyer.id)
    db.session.add_all([challenge, settings])
    db.session.commit()

    for statement in (
        'ALTER TABLE "user" ADD COLUMN producer_products JSON',
        "ALTER TABLE product_listing ADD COLUMN data JSON",
        "ALTER TABLE quotation_record ADD COLUMN data JSON",
        "ALTER TABLE settings_verification ADD COLUMN pending_changes JSON",
        "ALTER TABLE account_settings ADD COLUMN phone VARCHAR(30) NOT NULL DEFAULT ''",
    ):
        db.session.execute(text(statement))
    db.session.execute(
        text('UPDATE "user" SET producer_products = :products WHERE id = :id'),
        {"products": '["Yuca", "Ñame"]', "id": producer.id},
    )
    db.session.execute(
        text("UPDATE product_listing SET data = :data WHERE id = :id"),
        {
            "data": json.dumps(product_payload(name="Yuca migrada", certifications=["Orgánica"])),
            "id": listing.id,
        },
    )
    db.session.execute(
        text("UPDATE quotation_record SET data = :data WHERE id = :id"),
        {
            "data": json.dumps({"productName": "Yuca migrada", "clientName": "Cliente anterior", "totalCop": 5000}),
            "id": quote.id,
        },
    )
    db.session.execute(
        text("UPDATE settings_verification SET pending_changes = :changes WHERE id = :id"),
        {
            "changes": json.dumps(
                {
                    "name": "Nombre migrado",
                    "notifications": {
                        "notificationsEnabled": True,
                        "quoteNotifications": False,
                        "responseNotifications": True,
                    },
                }
            ),
            "id": challenge.id,
        },
    )
    db.session.execute(
        text("UPDATE account_settings SET phone = :phone WHERE user_id = :user_id"),
        {"phone": "3009998877", "user_id": buyer.id},
    )
    db.session.commit()

    _migrate_normalized_tables()
    db.session.expire_all()

    assert [item.name for item in ProducerProduct.query.filter_by(user_id=producer.id).order_by(ProducerProduct.id)] == [
        "Yuca",
        "Ñame",
    ]
    migrated_listing = db.session.get(ProductListing, listing.id)
    assert migrated_listing.name == "Yuca migrada"
    assert [item.name for item in migrated_listing.certifications] == ["Orgánica"]
    migrated_quote = db.session.get(QuotationRecord, quote.id)
    assert migrated_quote.product_name == "Yuca migrada"
    assert migrated_quote.total_cop == 5000
    assert buyer.phone == "3009998877"
    migrated_challenge = SettingsVerification.query.filter_by(user_id=buyer.id).first()
    assert migrated_challenge.pending_name == "Nombre migrado"
    assert migrated_challenge.pending_notifications_enabled is True
    assert migrated_challenge.pending_quote_notifications is False
    assert migrated_challenge.pending_response_notifications is True
    assert all(
        legacy_column not in {
            column["name"] for column in inspect(db.engine).get_columns(table_name)
        }
        for table_name, legacy_column in (
            ("user", "producer_products"),
            ("product_listing", "data"),
            ("quotation_record", "data"),
            ("settings_verification", "pending_changes"),
            ("account_settings", "phone"),
        )
    )


def test_profile_photo_is_persisted_and_rejects_invalid_data(client):
    user = create_user(google_sub="profile-user", email="profile@example.com")
    login_as(client, user)

    response = client.patch(
        "/api/account/profile",
        json={"avatar": "data:image/png;base64,aGVsbG8=", "city": "Lorica"},
    )

    assert response.status_code == 200
    assert response.get_json()["user"]["city"] == "Lorica"
    assert db.session.get(User, user.id).avatar == "data:image/png;base64,aGVsbG8="
    invalid = client.patch("/api/account/profile", json={"avatar": "javascript:alert(1)"})
    assert invalid.status_code == 400


def test_account_settings_requests_a_code_through_mail_sender(client, monkeypatch):
    user = create_user(google_sub="settings-user", email="settings@example.com")
    login_as(client, user)
    sent = []
    monkeypatch.setattr("app._send_settings_code", lambda account, code: sent.append((account.id, code)))

    response = client.post(
        "/api/account/settings/request-code",
        json={
            "name": "Nuevo Nombre",
            "notifications": {
                "notificationsEnabled": True,
                "quoteNotifications": False,
                "responseNotifications": True,
            },
        },
    )

    assert response.status_code == 200
    assert sent and sent[0][0] == user.id
    challenge = SettingsVerification.query.filter_by(user_id=user.id).first()
    assert challenge is not None
    assert challenge.pending_name == "Nuevo Nombre"
    assert challenge.pending_notifications_enabled is True
    assert challenge.pending_quote_notifications is False
    assert challenge.pending_response_notifications is True
    assert "pending_changes" not in {
        column["name"] for column in inspect(db.engine).get_columns("settings_verification")
    }
    verified = client.post(
        "/api/account/settings/verify-code",
        json={"code": sent[0][1]},
    )
    assert verified.status_code == 200
    assert verified.get_json()["user"]["name"] == "Nuevo Nombre"
    assert verified.get_json()["notifications"]["quoteNotifications"] is False
    assert SettingsVerification.query.count() == 0


def test_password_recovery_verifies_code_and_changes_password(client, monkeypatch):
    from werkzeug.security import check_password_hash, generate_password_hash

    user = create_user(
        google_sub="password-reset-user",
        email="reset@example.com",
        password_hash=generate_password_hash("old-password-123"),
    )
    sent = []
    monkeypatch.setattr("app._send_password_reset_code", lambda account, code: sent.append(code))

    request_response = client.post("/api/auth/password/request-code", json={"email": user.email})

    assert request_response.status_code == 200
    challenge = PasswordResetVerification.query.filter_by(user_id=user.id).first()
    assert challenge is not None
    assert challenge.code_hash != sent[0]
    verify_response = client.post(
        "/api/auth/password/verify-code",
        json={"email": user.email, "code": sent[0], "password": "new-password-456"},
    )
    assert verify_response.status_code == 200
    assert check_password_hash(db.session.get(User, user.id).password_hash, "new-password-456")


def test_resend_email_sender_uses_https_api_when_configured(monkeypatch):
    import app as backend

    user = User(google_sub="resend-test-user", email="resend@example.com", name="Resend")
    monkeypatch.setenv("RESEND_API_KEY", "test-key-only")
    monkeypatch.setenv("RESEND_FROM", "AgroCórdoba <test@example.com>")
    called = {}

    class Response:
        def raise_for_status(self):
            return None

    def fake_post(url, **kwargs):
        called.update(url=url, **kwargs)
        return Response()

    monkeypatch.setattr(backend.requests, "post", fake_post)
    backend._send_settings_code(user, "123456")

    assert called["url"] == "https://api.resend.com/emails"
    assert called["headers"]["Authorization"] == "Bearer test-key-only"
    assert called["json"]["to"] == [user.email]
    assert "123456" in called["json"]["text"]


def test_password_recovery_rejects_malformed_codes_without_consuming_attempts(client, monkeypatch):
    user = create_user(
        google_sub="malformed-password-reset-user",
        email="malformed-reset@example.com",
    )
    monkeypatch.setattr("app._send_password_reset_code", lambda account, code: None)
    client.post("/api/auth/password/request-code", json={"email": user.email})
    challenge = PasswordResetVerification.query.filter_by(user_id=user.id).first()
    assert challenge is not None

    response = client.post(
        "/api/auth/password/verify-code",
        json={"email": user.email, "code": "123", "password": "new-password-456"},
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "El código debe tener seis dígitos."
    assert challenge.attempts == 0


def test_google_login_explains_when_oauth_credentials_are_missing(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000/")

    response = client.get("/auth/google")

    assert response.status_code == 302
    assert response.headers["Location"].startswith("http://localhost:3000/?google_login=setup")


def test_google_login_uses_render_url_when_oauth_is_not_configured(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://agrocordoba.onrender.com")

    response = client.get("/auth/google")

    assert response.status_code == 302
    assert response.headers["Location"] == (
        "https://agrocordoba.onrender.com/?google_login=setup"
    )


def test_google_login_uses_render_callback_when_redirect_uri_is_not_configured(
    client, monkeypatch
):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.delenv("GOOGLE_REDIRECT_URI", raising=False)
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://agrocordoba.onrender.com/")
    requested_redirect_uris = []

    def authorize_redirect(redirect_uri):
        requested_redirect_uris.append(redirect_uri)
        return redirect(redirect_uri)

    monkeypatch.setattr(google, "authorize_redirect", authorize_redirect)

    response = client.get("/auth/google")

    assert response.status_code == 302
    assert requested_redirect_uris == [
        "https://agrocordoba.onrender.com/auth/google/callback"
    ]


def test_admin_can_edit_and_delete_a_user_with_related_records(client):
    admin = create_user(google_sub="admin-edit-sub", email="admin-edit@example.com", role="admin")
    producer = create_user(
        google_sub="producer-delete-sub",
        email="producer-delete@example.com",
        role="productor",
        status="activo",
    )
    buyer = create_user(google_sub="buyer-delete-sub", email="buyer-delete@example.com")
    listing = create_listing(producer)
    quote = create_quotation(
        buyer.id,
        producer.id,
        product_id="prod-to-delete",
        product_listing_id=listing.id,
    )
    db.session.add(Favorite(user_id=buyer.id, product_id="prod-to-delete"))
    db.session.commit()
    login_as(client, admin)

    edited = client.patch(
        f"/api/admin/users/{producer.id}",
        json={"name": "Productor actualizado", "email": producer.email, "city": "Lorica", "status": "activo", "farmName": "Finca Nueva", "association": "Cooperativa"},
    )
    assert edited.status_code == 200
    assert edited.get_json()["user"]["name"] == "Productor actualizado"

    deleted = client.delete(f"/api/admin/users/{buyer.id}")
    assert deleted.status_code == 200
    assert db.session.get(User, buyer.id) is None
    assert QuotationRecord.query.filter_by(client_id=buyer.id).count() == 0
    assert Favorite.query.filter_by(user_id=buyer.id).count() == 0
