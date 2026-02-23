import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface TeamMember { id: string; name: string; email: string; role: string; }

export default function PortalTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/users?role=worker,manager,super_admin").then((r) => setTeam(r.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Team — Client Portal" description="Your agency team" />
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Your Team</h1>
        {team.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-400"><p className="text-4xl mb-3">👥</p><p className="text-sm">No team members found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {team.map((member) => (
              <div key={member.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
                  {member.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white/90">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{member.role.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
