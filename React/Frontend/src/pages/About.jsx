import '@styles/_about.scss'

export default function About() {
    return (
        <>
            {/* El fragmento <> permite retornar múltiples elementos sin agregar un div extra al DOM
                imagen-acostada + imagen-about → clases SCSS que hacen que
                la imagen ocupe el ancho completo rompiendo el container */}

            <section className="imagen-acostada imagen-about">
                <img src="/images/imagenabout.png" alt="Aerial view of Santorini"/>
            </section>

            <section className="container about">
                <h1 className="about-title">ABOUT SANTORINI BLUE</h1>

                <p className="intro">
                    Our inn is a peaceful retreat by the sea, designed for those seeking rest in a warm and welcoming
                    atmosphere. With only a few rooms, we offer a more intimate and personalized experience, where every
                    detail is carefully arranged to make guests feel at home. Surrounded by Mediterranean landscapes,
                    the
                    inn blends traditional charm with modern comforts, creating the ideal place to enjoy the calm, the
                    sun,
                    and the beauty of the nearby sea.
                </p>

                <figure className="figure">
                    <img src="/images/about2.png" alt="Private cave pool overlooking the Aegean Sea."/>
                </figure>

                <h2 className="about-title">Hotel Amenities</h2>

                <ul className="amenities-list">
                    <li>Free resident car parking</li>
                    <li>Free high speed internet</li>
                    <li>Free Wi-Fi access</li>
                    <li>Breakfast included</li>
                    <li>Outdoor swimming pool</li>
                    <li>Direct beach access</li>
                    <li>24 hour reception and room service</li>
                    <li>Daily housekeeping service</li>
                    <li>Tea &amp; coffee making facilities</li>
                </ul>

            </section>
        </>
    )
}
