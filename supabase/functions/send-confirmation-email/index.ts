import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { format } from "npm:date-fns@3.3.1";
import { es } from "npm:date-fns/locale";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmailParams {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, customerEmail, serviceName, appointmentDate, appointmentTime } = await req.json() as EmailParams;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: Deno.env.get("EMAIL_USER"),
        pass: Deno.env.get("EMAIL_PASSWORD"),
      },
    });

    const formattedDate = format(new Date(appointmentDate), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ec4899;">🌸 ¡Tu cita en Glamora Studio está confirmada!</h1>
        
        <p>Hola ${customerName},</p>
        
        <p>¡Gracias por reservar con Glamora Studio! ✨<br>
        Estamos muy emocionados de recibirte y ofrecerte una experiencia única.</p>
        
        <div style="background-color: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #be185d; margin-top: 0;">Aquí tienes los detalles de tu cita:</h2>
          <p>
            <strong>Servicio:</strong> ${serviceName}<br>
            <strong>Fecha:</strong> ${formattedDate}<br>
            <strong>Hora:</strong> ${appointmentTime}<br>
            <strong>Ubicación:</strong> Glamora Studio, Res. Costas del Sol, 15 calle 21103 San Pedro Sula, Cortés
          </p>
        </div>
        
        <p>Si necesitas reprogramar o tienes alguna consulta, no dudes en contactarnos al (504) 9524-8210 o respondiendo a este correo.</p>
        
        <p>¡Estamos ansiosos por consentirte como te lo mereces! 💖</p>
        
        <p>Nos vemos pronto,<br>
        El equipo de Glamora</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
          <p>
            <a href="https://glamorastudio.com" style="color: #ec4899; text-decoration: none;">glamorastudio.com</a> | 
            <a href="https://instagram.com/glamorastudio" style="color: #ec4899; text-decoration: none;">Instagram</a> | 
            <a href="https://facebook.com/glamorastudio" style="color: #ec4899; text-decoration: none;">Facebook</a>
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Glamora Studio" <info@glamorastudiohn.com>',
      to: customerEmail,
      subject: "🌸 ¡Tu cita en Glamora Studio está confirmada!",
      html: emailContent,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});